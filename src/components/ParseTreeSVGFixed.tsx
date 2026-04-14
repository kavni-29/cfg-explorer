import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { layoutTree, type LayoutNode, type TreeNode } from '@/lib/cfg-engine-fixed';

interface ParseTreeSVGProps {
  root: TreeNode;
  visibleCount?: number;
  width?: number;
  height?: number;
  pulseLeaves?: boolean;
  interactive?: boolean;
}

function flattenLayout(node: LayoutNode): LayoutNode[] {
  return [node, ...node.children.flatMap(child => flattenLayout(child))];
}

function collectEdges(node: LayoutNode): { x1: number; y1: number; x2: number; y2: number; parentId: number; childId: number }[] {
  return node.children.flatMap(child => [
    {
      x1: node.x,
      y1: node.y,
      x2: child.x,
      y2: child.y,
      parentId: node.node.id,
      childId: child.node.id,
    },
    ...collectEdges(child),
  ]);
}

export default function ParseTreeSVGFixed({
  root,
  visibleCount,
  width = 700,
  height: explicitHeight,
  pulseLeaves = false,
  interactive = true,
}: ParseTreeSVGProps) {
  const layout = layoutTree(root, width, 70);
  const nodes = flattenLayout(layout);
  const height = explicitHeight ?? Math.max(...nodes.map(node => node.y)) + 80;
  const maxVisible = visibleCount ?? nodes.length;
  const visibleIds = new Set(nodes.slice(0, maxVisible).map(node => node.node.id));
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [offsets, setOffsets] = useState<Record<number, { x: number; y: number }>>({});
  const [dragPreview, setDragPreview] = useState<Record<number, { x: number; y: number }>>({});
  const [draggingNodeId, setDraggingNodeId] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    setHoveredNodeId(null);
    setSelectedNodeId(null);
    setOffsets({});
    setDragPreview({});
    setDraggingNodeId(null);
    setZoom(1);
  }, [root, visibleCount, width, explicitHeight]);

  useEffect(() => {
    if (!draggingNodeId) {
      return;
    }

    function toSvgPoint(clientX: number, clientY: number) {
      const svg = svgRef.current;
      if (!svg) {
        return null;
      }

      const point = svg.createSVGPoint();
      point.x = clientX;
      point.y = clientY;
      const transformed = point.matrixTransform(svg.getScreenCTM()?.inverse());
      return { x: transformed.x, y: transformed.y };
    }

    function handlePointerMove(event: PointerEvent) {
      const svgPoint = toSvgPoint(event.clientX, event.clientY);
      const baseNode = nodes.find(item => item.node.id === draggingNodeId);

      if (!svgPoint || !baseNode) {
        return;
      }

      setDragPreview(current => ({
        ...current,
        [draggingNodeId]: {
          x: svgPoint.x - baseNode.x,
          y: svgPoint.y - baseNode.y,
        },
      }));
    }

    function finishDrag() {
      setOffsets(current => {
        const next = { ...current };
        const preview = dragPreview[draggingNodeId];
        if (preview) {
          next[draggingNodeId] = preview;
        }
        return next;
      });
      setDragPreview(current => {
        const next = { ...current };
        delete next[draggingNodeId];
        return next;
      });
      setDraggingNodeId(null);
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', finishDrag);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', finishDrag);
    };
  }, [dragPreview, draggingNodeId, nodes]);

  const positionedNodes = useMemo(
    () =>
      nodes.map(item => {
        const offset = dragPreview[item.node.id] ?? offsets[item.node.id] ?? { x: 0, y: 0 };
        return {
          ...item,
          renderX: item.x + offset.x,
          renderY: item.y + offset.y,
        };
      }),
    [dragPreview, nodes, offsets],
  );

  const positionedNodeMap = useMemo(
    () => new Map(positionedNodes.map(item => [item.node.id, item])),
    [positionedNodes],
  );

  const edges = useMemo(
    () =>
      collectEdges(layout).map(edge => {
        const parent = positionedNodeMap.get(edge.parentId);
        const child = positionedNodeMap.get(edge.childId);

        return {
          ...edge,
          x1: parent?.renderX ?? edge.x1,
          y1: parent?.renderY ?? edge.y1,
          x2: child?.renderX ?? edge.x2,
          y2: child?.renderY ?? edge.y2,
        };
      }),
    [layout, positionedNodeMap],
  );

  const hoveredNode = useMemo(
    () => positionedNodes.find(item => item.node.id === hoveredNodeId) ?? null,
    [hoveredNodeId, positionedNodes],
  );

  const selectedNode = useMemo(
    () => positionedNodes.find(item => item.node.id === selectedNodeId) ?? null,
    [positionedNodes, selectedNodeId],
  );

  function clampZoom(nextZoom: number) {
    return Math.max(0.7, Math.min(1.8, Number(nextZoom.toFixed(2))));
  }

  function getNodeExplanation(node: TreeNode) {
    if (node.isEpsilon) {
      return 'This epsilon node represents an empty production in the grammar.';
    }

    if (node.isTerminal) {
      return `This terminal node is part of the final yield, so it appears in the completed string as "${node.label}".`;
    }

    if (node.children.length === 0) {
      return `This non-terminal "${node.label}" is waiting to be expanded by a production rule.`;
    }

    return `This non-terminal "${node.label}" has already been expanded into ${node.children.length} child node${node.children.length === 1 ? '' : 's'}.`;
  }

  const activeInfoNode = hoveredNode ?? selectedNode;

  return (
    <div
      className="relative w-full max-w-3xl mx-auto"
      onWheel={event => {
        if (!interactive) {
          return;
        }

        event.preventDefault();
        const delta = event.ctrlKey
          ? -event.deltaY * 0.0022
          : -event.deltaY * 0.0012;
        setZoom(current => clampZoom(current * Math.exp(delta)));
      }}
    >
      {activeInfoNode ? (
        <div
          className="pointer-events-none absolute z-10 w-56 rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,255,199,0.42))] p-3 text-sm text-foreground shadow-[0_20px_40px_-28px_rgba(84,134,135,0.95)]"
          style={{
            left: `${Math.min(Math.max((activeInfoNode.renderX / width) * 100, 8), 72)}%`,
            top: `${Math.max(((activeInfoNode.renderY - 54) / height) * 100, 2)}%`,
          }}
        >
          <p className="font-medium text-primary">{activeInfoNode.node.label}</p>
          <p className="mt-1 leading-6 text-muted-foreground">{getNodeExplanation(activeInfoNode.node)}</p>
          {interactive ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Click to pin this note. Drag the node to reshape the tree.
            </p>
          ) : null}
        </div>
      ) : null}

      {interactive ? (
        <div className="mb-4 rounded-2xl border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,255,199,0.22))] p-4 shadow-[0_16px_34px_-28px_rgba(84,134,135,0.5)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Interactive Tree Viewer
                </span>
                <p className="text-sm text-foreground">
                  Drag nodes live and use your trackpad or the zoom buttons to inspect the structure closely without losing the overall tree shape.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.16em] text-primary/80">Zoom</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setZoom(current => clampZoom(current - 0.1))}
                    className="rounded-full border border-border bg-card/80 px-3 py-1 text-sm transition-all duration-300 hover:bg-secondary hover:text-foreground"
                  >
                    -
                  </button>
                  <span className="min-w-14 text-center text-sm font-medium text-foreground">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={() => setZoom(current => clampZoom(current + 0.1))}
                    className="rounded-full border border-border bg-card/80 px-3 py-1 text-sm transition-all duration-300 hover:bg-secondary hover:text-foreground"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  setZoom(1);
                }}
                className="rounded-full border border-border bg-card/80 px-3 py-1.5 text-sm transition-all duration-300 hover:bg-secondary hover:text-foreground"
              >
                Reset view
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <motion.div
        animate={{ scale: zoom }}
        transition={{ type: 'spring', stiffness: 140, damping: 18 }}
        style={{ transformOrigin: 'center top' }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          style={{ minHeight: 220 }}
        >
        {edges.map(edge => {
          if (!visibleIds.has(edge.parentId) || !visibleIds.has(edge.childId)) {
            return null;
          }

          return (
            <motion.line
              key={`${edge.parentId}-${edge.childId}`}
              x1={edge.x1}
              y1={edge.y1 + 16}
              x2={edge.x2}
              y2={edge.y2 - 16}
              stroke="hsl(var(--border))"
              strokeWidth={1.5}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
            />
          );
        })}

        {positionedNodes.map((layoutNode, index) => {
          if (!visibleIds.has(layoutNode.node.id)) {
            return null;
          }

          const { node, renderX, renderY } = layoutNode;
          const fill = node.isEpsilon
            ? 'hsl(60 4% 90%)'
            : node.isTerminal
              ? 'hsl(var(--yellow))'
              : 'hsl(210 40% 96%)';
          const stroke = node.isEpsilon ? 'hsl(60 4% 70%)' : 'hsl(var(--teal))';
          const isSelected = selectedNodeId === node.id;
          const strokeWidth = node.isEpsilon ? 1.5 : isSelected ? 2.8 : 2;
          const shouldPulse = pulseLeaves && node.isTerminal;

          return (
            <motion.g
              key={node.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: index * 0.06 }}
              onPointerDown={event => {
                if (!interactive) {
                  return;
                }

                event.preventDefault();
                event.stopPropagation();
                setDraggingNodeId(node.id);
                setSelectedNodeId(node.id);
                setDragPreview(current => ({
                  ...current,
                  [node.id]: offsets[node.id] ?? { x: 0, y: 0 },
                }));
              }}
              onClick={() => {
                if (!interactive) {
                  return;
                }

                setSelectedNodeId(current => (current === node.id ? null : node.id));
              }}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(current => (current === node.id ? null : current))}
              whileHover={interactive ? { scale: 1.05 } : undefined}
              whileTap={interactive ? { scale: 1.03 } : undefined}
              style={{ cursor: interactive ? (draggingNodeId === node.id ? 'grabbing' : 'grab') : 'default' }}
            >
              <ellipse
                cx={renderX + 5}
                cy={renderY + 17}
                rx={30}
                ry={9}
                fill="rgba(44,44,42,0.12)"
              />
              <rect
                x={renderX - 24}
                y={renderY - 16}
                width={48}
                height={32}
                rx={8}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                style={{
                  animation: shouldPulse ? 'pulse-border 1.5s ease-in-out infinite' : undefined,
                  filter: isSelected ? 'drop-shadow(0 14px 18px rgba(84,134,135,0.35))' : 'drop-shadow(0 10px 14px rgba(44,44,42,0.12))',
                }}
              />
              <rect
                x={renderX - 20}
                y={renderY - 12}
                width={40}
                height={10}
                rx={5}
                fill="rgba(255,255,255,0.24)"
              />
              <text
                x={renderX}
                y={renderY + 5}
                textAnchor="middle"
                className="text-xs font-mono fill-foreground"
                style={{ fontSize: 13 }}
              >
                {node.label}
              </text>
            </motion.g>
          );
        })}
        </svg>
      </motion.div>

      {interactive ? (
        <div className="mt-4 rounded-2xl border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,255,199,0.3))] px-4 py-3 shadow-[0_16px_34px_-28px_rgba(84,134,135,0.5)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
              Interactive Tree
            </span>
            <p className="text-sm text-foreground">
              Drag any node to reshape the tree live. Use your trackpad or the zoom buttons to move in and out smoothly.
            </p>
          </div>
          {selectedNode ? (
            <button
              onClick={() =>
                setOffsets(current => {
                  const next = { ...current };
                  delete next[selectedNode.node.id];
                  return next;
                })
              }
              className="mt-3 rounded-full border border-border bg-card/80 px-3 py-1.5 text-sm transition-all duration-300 hover:bg-secondary hover:text-foreground"
            >
              Reset {selectedNode.node.label} position
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
