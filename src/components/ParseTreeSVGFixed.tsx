import { motion } from 'framer-motion';
import { layoutTree, type LayoutNode, type TreeNode } from '@/lib/cfg-engine-fixed';

interface ParseTreeSVGProps {
  root: TreeNode;
  visibleCount?: number;
  width?: number;
  height?: number;
  pulseLeaves?: boolean;
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
}: ParseTreeSVGProps) {
  const layout = layoutTree(root, width, 70);
  const nodes = flattenLayout(layout);
  const edges = collectEdges(layout);
  const height = explicitHeight ?? Math.max(...nodes.map(node => node.y)) + 80;
  const maxVisible = visibleCount ?? nodes.length;
  const visibleIds = new Set(nodes.slice(0, maxVisible).map(node => node.node.id));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full max-w-3xl mx-auto"
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

      {nodes.map((layoutNode, index) => {
        if (!visibleIds.has(layoutNode.node.id)) {
          return null;
        }

        const { node, x, y } = layoutNode;
        const fill = node.isEpsilon
          ? 'hsl(60 4% 90%)'
          : node.isTerminal
            ? 'hsl(var(--yellow))'
            : 'hsl(210 40% 96%)';
        const stroke = node.isEpsilon ? 'hsl(60 4% 70%)' : 'hsl(var(--teal))';
        const strokeWidth = node.isEpsilon ? 1.5 : 2;
        const shouldPulse = pulseLeaves && node.isTerminal;

        return (
          <motion.g
            key={node.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: index * 0.06 }}
          >
            <rect
              x={x - 24}
              y={y - 16}
              width={48}
              height={32}
              rx={8}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              style={shouldPulse ? { animation: 'pulse-border 1.5s ease-in-out infinite' } : undefined}
            />
            <text
              x={x}
              y={y + 5}
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
  );
}
