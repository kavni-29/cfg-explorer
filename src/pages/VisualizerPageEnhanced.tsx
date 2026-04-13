import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
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

export default function VisualizerPageEnhanced({ state }: VisualizerPageProps) {
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
      <div className="rounded-[28px] border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,255,243,0.94))] p-6 shadow-[0_28px_64px_-44px_rgba(84,134,135,0.95)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-primary/80">Visualizer Studio</p>
            <h2 className="mt-2 text-2xl font-medium text-foreground">See how the grammar behaves</h2>
            <p className="mt-2 text-[15px] leading-7 text-muted-foreground">
              Switch between construction, ambiguity, and yield to study the same grammar from three different viewpoints.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,255,199,0.46))] px-4 py-3 text-sm shadow-[0_18px_40px_-34px_rgba(84,134,135,0.82)]">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">Current source</span>
            </div>
            <p className="mt-2 text-[15px] text-muted-foreground">
              {state.parseTree
                ? `Using your latest generated result for "${state.inputString || 'ε'}".`
                : 'No custom result yet, so the visualizer is showing the arithmetic example.'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          { id: 'construction' as SubTab, label: 'Tree Construction' },
          { id: 'ambiguous' as SubTab, label: 'Ambiguous Grammar' },
          { id: 'yield' as SubTab, label: 'Yield of a Tree' },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`nav-pill text-[15px] ${subTab === tab.id ? 'nav-pill-active' : 'nav-pill-inactive'}`}
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
      className="rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,247,240,0.94))] p-6 shadow-[0_24px_54px_-40px_rgba(84,134,135,0.9)] space-y-5"
    >
      <h3 className="text-xl font-medium text-foreground">Step-by-Step Tree Construction</h3>
      <div className="overflow-x-auto">
        <ParseTreeSVGFixed root={tree} visibleCount={visibleNodes} />
      </div>
      <p className="rounded-xl bg-[linear-gradient(180deg,rgba(255,255,199,0.52),rgba(255,255,255,0.94))] px-4 py-3 text-center text-[15px] text-foreground shadow-[0_14px_28px_-24px_rgba(84,134,135,0.72)]">
        {steps[stepIndex]}
      </p>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setVisibleNodes(count => Math.max(1, count - 1))}
          disabled={visibleNodes <= 1}
          className="rounded-lg bg-muted px-4 py-2 text-[15px] font-medium text-muted-foreground transition-all duration-300 hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
        >
          Previous
        </button>
        <button
          onClick={() => setVisibleNodes(1)}
          className="rounded-lg px-4 py-2 text-[15px] font-medium text-muted-foreground transition-all duration-300 hover:text-foreground"
        >
          Restart
        </button>
        <button
          onClick={() => setVisibleNodes(count => Math.min(totalNodes, count + 1))}
          disabled={visibleNodes >= totalNodes}
          className="rounded-lg bg-muted px-4 py-2 text-[15px] font-medium text-muted-foreground transition-all duration-300 hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
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
      className="rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,247,240,0.94))] p-6 shadow-[0_24px_54px_-40px_rgba(84,134,135,0.9)] space-y-5"
    >
      <h3 className="text-xl font-medium text-foreground">Ambiguous Grammar Example</h3>
      <p className="text-[15px] text-muted-foreground">
        Grammar: <span className="font-mono text-foreground">E -&gt; E + E | E * E | id</span> · String: <span className="font-mono text-foreground">{ambiguousInput}</span>
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,247,240,0.88))] p-4 shadow-[0_18px_40px_-34px_rgba(84,134,135,0.82)]">
          <h4 className="mb-2 text-center text-[15px] font-medium text-primary">Leftmost parse tree</h4>
          {leftTree ? <ParseTreeSVGFixed root={leftTree} width={350} /> : null}
        </div>
        <div className="rounded-2xl border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,247,240,0.88))] p-4 shadow-[0_18px_40px_-34px_rgba(84,134,135,0.82)]">
          <h4 className="mb-2 text-center text-[15px] font-medium text-primary">Rightmost parse tree</h4>
          {rightTree ? <ParseTreeSVGFixed root={rightTree} width={350} /> : null}
        </div>
      </div>

      <div className="rounded-xl bg-[linear-gradient(180deg,rgba(255,255,199,0.62),rgba(255,255,255,0.95))] p-4 text-[15px] leading-relaxed text-foreground shadow-[0_14px_28px_-24px_rgba(84,134,135,0.72)]">
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
      className="rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,247,240,0.94))] p-6 shadow-[0_24px_54px_-40px_rgba(84,134,135,0.9)] space-y-5"
    >
      <h3 className="text-xl font-medium text-foreground">Yield of a Parse Tree</h3>
      <p className="text-[15px] text-muted-foreground">
        The yield is the string formed by reading the terminal leaves from left to right.
      </p>

      <div className="overflow-x-auto">
        <ParseTreeSVGFixed root={tree} pulseLeaves />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {yieldSymbols.map((symbol, index) => (
          <motion.span
            key={`${symbol}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.12, duration: 0.25 }}
            className="rounded-full border border-primary/30 bg-secondary px-4 py-2 font-mono text-[17px] text-foreground shadow-[0_14px_28px_-24px_rgba(84,134,135,0.72)]"
          >
            {symbol}
          </motion.span>
        ))}
      </div>

      <p className="text-center text-[15px] text-muted-foreground">
        Yield: <span className="font-mono text-foreground">{yieldSymbols.join(' ') || 'ε'}</span>
      </p>
    </motion.div>
  );
}
