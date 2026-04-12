import { useState } from 'react';
import { motion } from 'framer-motion';
import ParseTreeSVG from '@/components/ParseTreeSVG';
import { type TreeNode, getYield } from '@/lib/cfg-engine';

type SubTab = 'construction' | 'ambiguous' | 'yield';

// Static example trees
const exampleTree: TreeNode = {
  id: 0, label: 'E', isTerminal: false, isEpsilon: false,
  children: [
    {
      id: 1, label: 'E', isTerminal: false, isEpsilon: false,
      children: [
        { id: 4, label: 'id', isTerminal: true, isEpsilon: false, children: [] },
      ],
    },
    { id: 2, label: '+', isTerminal: true, isEpsilon: false, children: [] },
    {
      id: 3, label: 'T', isTerminal: false, isEpsilon: false,
      children: [
        {
          id: 5, label: 'T', isTerminal: false, isEpsilon: false,
          children: [
            { id: 8, label: 'id', isTerminal: true, isEpsilon: false, children: [] },
          ],
        },
        { id: 6, label: '*', isTerminal: true, isEpsilon: false, children: [] },
        {
          id: 7, label: 'F', isTerminal: false, isEpsilon: false,
          children: [
            { id: 9, label: 'id', isTerminal: true, isEpsilon: false, children: [] },
          ],
        },
      ],
    },
  ],
};

// Ambiguous: two different trees for "id + id * id" with E → E+E | E*E | id
const ambiguousTree1: TreeNode = {
  id: 0, label: 'E', isTerminal: false, isEpsilon: false,
  children: [
    {
      id: 1, label: 'E', isTerminal: false, isEpsilon: false,
      children: [{ id: 5, label: 'id', isTerminal: true, isEpsilon: false, children: [] }],
    },
    { id: 2, label: '+', isTerminal: true, isEpsilon: false, children: [] },
    {
      id: 3, label: 'E', isTerminal: false, isEpsilon: false,
      children: [
        {
          id: 6, label: 'E', isTerminal: false, isEpsilon: false,
          children: [{ id: 9, label: 'id', isTerminal: true, isEpsilon: false, children: [] }],
        },
        { id: 7, label: '*', isTerminal: true, isEpsilon: false, children: [] },
        {
          id: 8, label: 'E', isTerminal: false, isEpsilon: false,
          children: [{ id: 10, label: 'id', isTerminal: true, isEpsilon: false, children: [] }],
        },
      ],
    },
  ],
};

const ambiguousTree2: TreeNode = {
  id: 20, label: 'E', isTerminal: false, isEpsilon: false,
  children: [
    {
      id: 21, label: 'E', isTerminal: false, isEpsilon: false,
      children: [
        {
          id: 24, label: 'E', isTerminal: false, isEpsilon: false,
          children: [{ id: 27, label: 'id', isTerminal: true, isEpsilon: false, children: [] }],
        },
        { id: 25, label: '+', isTerminal: true, isEpsilon: false, children: [] },
        {
          id: 26, label: 'E', isTerminal: false, isEpsilon: false,
          children: [{ id: 28, label: 'id', isTerminal: true, isEpsilon: false, children: [] }],
        },
      ],
    },
    { id: 22, label: '*', isTerminal: true, isEpsilon: false, children: [] },
    {
      id: 23, label: 'E', isTerminal: false, isEpsilon: false,
      children: [{ id: 29, label: 'id', isTerminal: true, isEpsilon: false, children: [] }],
    },
  ],
};

function countNodes(node: TreeNode): number {
  return 1 + node.children.reduce((s, c) => s + countNodes(c), 0);
}

const constructionSteps = [
  'Start with the root node E (the start symbol).',
  'Expand E → E + T using the addition rule.',
  'Expand left E → id (a terminal leaf).',
  'The + symbol is already a terminal.',
  'Expand T → T * F using the multiplication rule.',
  'Expand T → id (a terminal leaf).',
  'The * symbol is already a terminal.',
  'Expand F → id (a terminal leaf).',
  'All leaves are terminals. The tree is complete!',
];

export default function VisualizerPage() {
  const [subTab, setSubTab] = useState<SubTab>('construction');

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Sub-tabs */}
      <div className="flex gap-2">
        {([
          { id: 'construction' as SubTab, label: 'Tree Construction' },
          { id: 'ambiguous' as SubTab, label: 'Ambiguous Grammar' },
          { id: 'yield' as SubTab, label: 'Yield of a Tree' },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`nav-pill text-sm ${subTab === tab.id ? 'nav-pill-active' : 'nav-pill-inactive'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === 'construction' && <TreeConstruction />}
      {subTab === 'ambiguous' && <AmbiguousView />}
      {subTab === 'yield' && <YieldView />}
    </motion.div>
  );
}

function TreeConstruction() {
  const totalNodes = countNodes(exampleTree);
  const [visibleNodes, setVisibleNodes] = useState(1);
  const stepIdx = Math.min(visibleNodes - 1, constructionSteps.length - 1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card rounded-2xl border border-border p-6 space-y-5"
    >
      <h3 className="text-lg font-medium text-foreground">Step-by-Step Tree Construction</h3>
      <p className="text-sm text-muted-foreground">
        Grammar: E → E + T | T, &nbsp; T → T * F | F, &nbsp; F → id
      </p>

      <div className="overflow-x-auto">
        <ParseTreeSVG root={exampleTree} visibleCount={visibleNodes} />
      </div>

      <p className="text-center text-sm text-foreground bg-muted/30 rounded-lg py-3 px-4">
        {constructionSteps[stepIdx]}
      </p>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setVisibleNodes(Math.max(1, visibleNodes - 1))}
          disabled={visibleNodes <= 1}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground disabled:opacity-40 transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
        >
          Previous
        </button>
        <button
          onClick={() => setVisibleNodes(1)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-300"
        >
          Restart
        </button>
        <button
          onClick={() => setVisibleNodes(Math.min(totalNodes, visibleNodes + 1))}
          disabled={visibleNodes >= totalNodes}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground disabled:opacity-40 transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
        >
          Next
        </button>
      </div>
    </motion.div>
  );
}

function AmbiguousView() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card rounded-2xl border border-border p-6 space-y-5"
    >
      <h3 className="text-lg font-medium text-foreground">Ambiguous Grammar Example</h3>
      <p className="text-sm text-muted-foreground">
        Grammar: E → E + E | E * E | id &nbsp;·&nbsp; String: <span className="font-mono">id + id * id</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-primary text-center">Parse Tree 1 (+ first)</h4>
          <ParseTreeSVG root={ambiguousTree1} width={350} />
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-primary text-center">Parse Tree 2 (* first)</h4>
          <ParseTreeSVG root={ambiguousTree2} width={350} />
        </div>
      </div>

      <div className="bg-secondary/50 rounded-xl p-4 text-sm text-foreground leading-relaxed">
        <strong className="text-primary">Why ambiguity matters:</strong> The two trees imply different evaluation orders.
        Tree 1 evaluates multiplication before addition (standard precedence), while Tree 2 evaluates addition first.
        Ambiguity in a grammar means the language can be interpreted in multiple ways, which is problematic for compilers and interpreters.
      </div>
    </motion.div>
  );
}

function YieldView() {
  const yieldSymbols = getYield(exampleTree);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card rounded-2xl border border-border p-6 space-y-5"
    >
      <h3 className="text-lg font-medium text-foreground">Yield of a Parse Tree</h3>
      <p className="text-sm text-muted-foreground">
        The yield is the string formed by reading all leaf nodes from left to right.
      </p>

      <div className="overflow-x-auto">
        <ParseTreeSVG root={exampleTree} pulseLeaves />
      </div>

      <div className="flex items-center justify-center gap-2 flex-wrap">
        {yieldSymbols.map((sym, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15, duration: 0.3 }}
            className="px-4 py-2 bg-secondary rounded-full font-mono text-base border border-primary/30 text-foreground"
          >
            {sym}
          </motion.span>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Yield: <span className="font-mono text-foreground">{yieldSymbols.join(' ')}</span>
      </p>
    </motion.div>
  );
}
