import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import ParseTreeSVGFixed from '@/components/ParseTreeSVGFixed';
import {
  EXAMPLES,
  buildParseTree,
  countNodes,
  derive,
  getConstructionSteps,
  getYield,
  parseGrammar,
  type TreeNode,
} from '@/lib/cfg-engine-fixed';
import type { GeneratorState } from './Index';

type SubTab = 'construction' | 'ambiguous' | 'yield';

const ambiguousGrammar = `E -> E + E | E * E | id`;
const ambiguousInput = 'id + id * id';

function getAmbiguousTrees() {
  const grammar = parseGrammar(ambiguousGrammar);
  const leftSteps = derive(grammar, ambiguousInput, 'leftmost');
  const rightSteps = derive(grammar, ambiguousInput, 'rightmost');

  return {
    leftTree: leftSteps ? buildParseTree(grammar, leftSteps) : null,
    rightTree: rightSteps ? buildParseTree(grammar, rightSteps) : null,
  };
}

interface VisualizerPageProps {
  state: GeneratorState;
}

export default function VisualizerPageFixed({ state }: VisualizerPageProps) {
  const [subTab, setSubTab] = useState<SubTab>('construction');
  const fallbackGrammar = parseGrammar(EXAMPLES['Arithmetic expressions'].grammar);
  const fallbackSteps = derive(fallbackGrammar, EXAMPLES['Arithmetic expressions'].input, 'leftmost');
  const fallbackTree = fallbackSteps ? buildParseTree(fallbackGrammar, fallbackSteps) : null;
  const activeSteps = state.leftSteps || state.rightSteps || fallbackSteps;
  const activeTree = state.parseTree || fallbackTree;
  const yieldSymbols = activeTree ? getYield(activeTree) : [];
  const constructionSteps = activeSteps ? getConstructionSteps(activeSteps) : ['Start with the grammar start symbol.'];

  const ambiguousTrees = useMemo(() => getAmbiguousTrees(), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-base font-medium text-foreground">Current visualization source</h3>
            <p className="text-sm text-muted-foreground">
              {state.parseTree
                ? `Using your latest generated result for "${state.inputString || 'ε'}".`
                : 'No custom result yet, so the visualizer is showing the arithmetic example.'}
            </p>
          </div>
          <div className="text-xs font-mono text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
            {state.parseTree ? state.inputString || 'ε' : EXAMPLES['Arithmetic expressions'].input}
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
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

      {subTab === 'construction' && activeTree ? (
        <TreeConstruction tree={activeTree} steps={constructionSteps} />
      ) : null}
      {subTab === 'ambiguous' ? (
        <AmbiguousView leftTree={ambiguousTrees.leftTree} rightTree={ambiguousTrees.rightTree} />
      ) : null}
      {subTab === 'yield' && activeTree ? <YieldView tree={activeTree} yieldSymbols={yieldSymbols} /> : null}
    </motion.div>
  );
}

function TreeConstruction({ tree, steps }: { tree: TreeNode; steps: string[] }) {
  const totalNodes = countNodes(tree);
  const [visibleNodes, setVisibleNodes] = useState(1);
  const stepIndex = Math.min(visibleNodes - 1, steps.length - 1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card rounded-2xl border border-border p-6 space-y-5"
    >
      <h3 className="text-lg font-medium text-foreground">Step-by-Step Tree Construction</h3>
      <div className="overflow-x-auto">
        <ParseTreeSVGFixed root={tree} visibleCount={visibleNodes} />
      </div>
      <p className="text-center text-sm text-foreground bg-muted/30 rounded-lg py-3 px-4">{steps[stepIndex]}</p>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setVisibleNodes(count => Math.max(1, count - 1))}
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
          onClick={() => setVisibleNodes(count => Math.min(totalNodes, count + 1))}
          disabled={visibleNodes >= totalNodes}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground disabled:opacity-40 transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
        >
          Next
        </button>
      </div>
    </motion.div>
  );
}

function AmbiguousView({ leftTree, rightTree }: { leftTree: TreeNode | null; rightTree: TreeNode | null }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card rounded-2xl border border-border p-6 space-y-5"
    >
      <h3 className="text-lg font-medium text-foreground">Ambiguous Grammar Example</h3>
      <p className="text-sm text-muted-foreground">
        Grammar: E -&gt; E + E | E * E | id · String: <span className="font-mono">{ambiguousInput}</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-primary text-center">Leftmost parse tree</h4>
          {leftTree ? <ParseTreeSVGFixed root={leftTree} width={350} /> : null}
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-primary text-center">Rightmost parse tree</h4>
          {rightTree ? <ParseTreeSVGFixed root={rightTree} width={350} /> : null}
        </div>
      </div>

      <div className="bg-secondary/50 rounded-xl p-4 text-sm text-foreground leading-relaxed">
        <strong className="text-primary">Why ambiguity matters:</strong> if one grammar allows multiple distinct parse structures for the same string, a compiler or parser can assign different meanings to the same input.
      </div>
    </motion.div>
  );
}

function YieldView({ tree, yieldSymbols }: { tree: TreeNode; yieldSymbols: string[] }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card rounded-2xl border border-border p-6 space-y-5"
    >
      <h3 className="text-lg font-medium text-foreground">Yield of a Parse Tree</h3>
      <p className="text-sm text-muted-foreground">
        The yield is the string formed by reading the terminal leaves from left to right.
      </p>

      <div className="overflow-x-auto">
        <ParseTreeSVGFixed root={tree} pulseLeaves />
      </div>

      <div className="flex items-center justify-center gap-2 flex-wrap">
        {yieldSymbols.map((symbol, index) => (
          <motion.span
            key={`${symbol}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.12, duration: 0.25 }}
            className="px-4 py-2 bg-secondary rounded-full font-mono text-base border border-primary/30 text-foreground"
          >
            {symbol}
          </motion.span>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Yield: <span className="font-mono text-foreground">{yieldSymbols.join(' ') || 'ε'}</span>
      </p>
    </motion.div>
  );
}
