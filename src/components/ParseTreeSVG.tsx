import { motion } from 'framer-motion';
import { layoutTree, type TreeNode, type LayoutNode } from '@/lib/cfg-engine';

interface ParseTreeSVGProps {
  root: TreeNode;
  visibleCount?: number; // for animated reveal
  width?: number;
  height?: number;
  pulseLeaves?: boolean;
}

function flattenLayout(node: LayoutNode): LayoutNode[] {
  const result: LayoutNode[] = [node];
  for (const child of node.children) {
    result.push(...flattenLayout(child));
  }
  return result;
}

function collectEdges(node: LayoutNode): { x1: number; y1: number; x2: number; y2: number }[] {
  const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (const child of node.children) {
    edges.push({ x1: node.x, y1: node.y, x2: child.x, y2: child.y });
    edges.push(...collectEdges(child));
  }
  return edges;
}

export default function ParseTreeSVG({
  root,
  visibleCount,
  width = 700,
  height: propHeight,
  pulseLeaves = false,
}: ParseTreeSVGProps) {
  const layout = layoutTree(root, width, 70);
  const allNodes = flattenLayout(layout);
  const allEdges = collectEdges(layout);

  // Calculate height based on tree depth
  const maxY = Math.max(...allNodes.map(n => n.y));
  const height = propHeight || maxY + 80;

  const visible = visibleCount !== undefined ? visibleCount : allNodes.length;

  // Build a set of visible node IDs
  const visibleIds = new Set(allNodes.slice(0, visible).map(n => n.node.id));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full max-w-3xl mx-auto"
      style={{ minHeight: 200 }}
    >
      {/* Edges */}
      {allEdges.map((edge, i) => {
        // Only show edge if both endpoints are visible
        const parentNode = allNodes.find(n => n.x === edge.x1 && n.y === edge.y1);
        const childNode = allNodes.find(n => n.x === edge.x2 && n.y === edge.y2);
        if (!parentNode || !childNode) return null;
        if (!visibleIds.has(parentNode.node.id) || !visibleIds.has(childNode.node.id)) return null;

        return (
          <motion.line
            key={`edge-${i}`}
            x1={edge.x1}
            y1={edge.y1 + 16}
            x2={edge.x2}
            y2={edge.y2 - 16}
            stroke="hsl(var(--border))"
            strokeWidth={1.5}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        );
      })}

      {/* Nodes */}
      {allNodes.map((layoutNode, i) => {
        if (!visibleIds.has(layoutNode.node.id)) return null;
        const { node, x, y } = layoutNode;
        const isTerminal = node.isTerminal;
        const isEpsilon = node.isEpsilon;

        let fillClass = 'fill-[hsl(210,40%,96%)]';
        let strokeClass = 'stroke-[hsl(var(--teal))]';
        let strokeW = 2;

        if (isTerminal) {
          fillClass = 'fill-[hsl(var(--yellow))]';
        } else if (isEpsilon) {
          fillClass = 'fill-[hsl(60,4%,90%)]';
          strokeClass = 'stroke-[hsl(60,4%,70%)]';
          strokeW = 1.5;
        }

        const shouldPulse = pulseLeaves && isTerminal;

        return (
          <motion.g
            key={`node-${node.id}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
          >
            <rect
              x={x - 24}
              y={y - 16}
              width={48}
              height={32}
              rx={8}
              className={`${fillClass} ${strokeClass}`}
              strokeWidth={strokeW}
              style={shouldPulse ? { animation: 'pulse-border 1.5s ease-in-out infinite' } : {}}
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
