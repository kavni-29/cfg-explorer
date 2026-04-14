import { type RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Expand, Pause, Play, RefreshCcw, Sparkles, X } from 'lucide-react';
import ParseTreeSVGFixed from '@/components/ParseTreeSVGFixed';
import {
  EXAMPLES,
  buildParseTree,
  countNodes,
  derive,
  getConstructionSteps,
  getYield,
  parseGrammar,
  type DerivationStep,
  type TreeNode,
} from '@/lib/cfg-engine-fixed';
import { exportSvgElementAsPng } from '@/lib/export-utils';
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

function deriveVisualizerTree(grammarText: string, inputString: string) {
  const grammar = parseGrammar(grammarText);
  if (grammar.rules.length === 0) {
    return {
      tree: null as TreeNode | null,
      steps: null as DerivationStep[] | null,
      error: 'No valid grammar rules were found. Try a line such as S -> a S b | ε.',
    };
  }

  const steps = derive(grammar, inputString, 'leftmost');
  if (!steps) {
    return {
      tree: null,
      steps: null,
      error: 'This string could not be derived from the grammar in leftmost mode.',
    };
  }

  return {
    tree: buildParseTree(grammar, steps),
    steps,
    error: '',
  };
}

interface VisualizerPageProps {
  state: GeneratorState;
}

export default function VisualizerPageEnhanced({ state }: VisualizerPageProps) {
  const [subTab, setSubTab] = useState<SubTab>('construction');
  const [visualizerExample, setVisualizerExample] = useState('Arithmetic expressions');
  const [grammarText, setGrammarText] = useState(EXAMPLES['Arithmetic expressions'].grammar);
  const [inputString, setInputString] = useState(EXAMPLES['Arithmetic expressions'].input);
  const [customTree, setCustomTree] = useState<TreeNode | null>(null);
  const [customSteps, setCustomSteps] = useState<DerivationStep[] | null>(null);
  const [customError, setCustomError] = useState('');
  const fallbackGrammar = parseGrammar(EXAMPLES['Arithmetic expressions'].grammar);
  const fallbackSteps = derive(fallbackGrammar, EXAMPLES['Arithmetic expressions'].input, 'leftmost');
  const fallbackTree = fallbackSteps ? buildParseTree(fallbackGrammar, fallbackSteps) : null;
  const activeSteps = customSteps || state.leftSteps || state.rightSteps || fallbackSteps;
  const activeTree = customTree || state.parseTree || fallbackTree;
  const yieldSymbols = activeTree ? getYield(activeTree) : [];
  const constructionSteps = activeSteps ? getConstructionSteps(activeSteps) : ['Start with the grammar start symbol.'];

  const ambiguousTrees = useMemo(() => getAmbiguousTrees(), []);

  function handleExamplePick(name: string) {
    const example = EXAMPLES[name];
    setVisualizerExample(name);
    setGrammarText(example.grammar);
    setInputString(example.input);
    setCustomTree(null);
    setCustomSteps(null);
    setCustomError('');
  }

  function handleGenerateTree() {
    const result = deriveVisualizerTree(grammarText, inputString);
    setCustomTree(result.tree);
    setCustomSteps(result.steps);
    setCustomError(result.error);
  }

  function handleUseGeneratorTree() {
    setCustomTree(null);
    setCustomSteps(null);
    setCustomError('');
    setVisualizerExample('Generator result');
  }

  const sourceLabel = customTree
    ? `Using the tree you generated here for "${inputString || 'ε'}".`
    : state.parseTree
      ? `Using your latest generator result for "${state.inputString || 'ε'}".`
      : 'No custom result yet, so the visualizer is showing the arithmetic example.';

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
              Build a tree directly in this page, drag nodes to inspect structure, and compare the same grammar through construction, ambiguity, and yield.
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

      <section className="rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,247,240,0.94))] p-6 shadow-[0_24px_54px_-40px_rgba(84,134,135,0.9)]">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-primary/80">Tree Playground</p>
            <h3 className="mt-2 text-xl font-medium text-foreground">Generate a parse tree right here</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(EXAMPLES).map(name => (
              <button
                key={name}
                onClick={() => handleExamplePick(name)}
                className={`chip ${visualizerExample === name ? 'chip-active' : ''}`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-2">
            <label className="text-[15px] font-medium text-foreground">Grammar Rules</label>
            <textarea
              value={grammarText}
              onChange={event => {
                setGrammarText(event.target.value);
                setVisualizerExample('Custom grammar');
                setCustomError('');
              }}
              rows={7}
              className="w-full rounded-2xl border border-border p-4 font-mono text-[15px] text-foreground transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="S -> a S b | ε"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[15px] font-medium text-foreground">Input String</label>
              <input
                type="text"
                value={inputString}
                onChange={event => {
                  setInputString(event.target.value);
                  setVisualizerExample('Custom grammar');
                  setCustomError('');
                }}
                className="w-full rounded-2xl border border-border px-4 py-3 font-mono text-[15px] text-foreground transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="id + id * id"
              />
            </div>

            <div className="rounded-2xl border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,255,199,0.42))] p-4 shadow-[0_18px_40px_-34px_rgba(84,134,135,0.82)]">
              <p className="text-sm font-medium text-primary">Interactive tree controls</p>
              <p className="mt-2 text-[15px] leading-7 text-muted-foreground">
                Every tree here is draggable. Select a node to pin its explanation, then move it to spread out branches and inspect the structure more clearly.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button onClick={handleGenerateTree} className="btn-generate flex items-center gap-2">
                <Play className="h-4 w-4" />
                Generate Tree
              </button>
              <button
                onClick={handleUseGeneratorTree}
                className="flex items-center gap-2 rounded-xl border border-border bg-white/85 px-4 py-3 text-[15px] font-medium text-muted-foreground transition-all duration-300 hover:bg-secondary hover:text-foreground"
              >
                <RefreshCcw className="h-4 w-4" />
                Use Generator Result
              </button>
            </div>
            {customError ? <p className="text-[15px] text-destructive">{customError}</p> : null}
          </div>
        </div>
      </section>

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFocused, setIsFocused] = useState(false);
  const treeExportRef = useRef<HTMLDivElement | null>(null);
  const stepIndex = Math.min(visibleNodes - 1, steps.length - 1);

  useEffect(() => {
    setVisibleNodes(1);
    setIsPlaying(false);
  }, [tree, steps]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    if (visibleNodes >= totalNodes) {
      setIsPlaying(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      setVisibleNodes(count => Math.min(totalNodes, count + 1));
    }, 1000 / playbackSpeed);

    return () => window.clearTimeout(timeout);
  }, [isPlaying, playbackSpeed, totalNodes, visibleNodes]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,247,240,0.94))] p-6 shadow-[0_24px_54px_-40px_rgba(84,134,135,0.9)] space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-medium text-foreground">Step-by-Step Tree Construction</h3>
          <div className="flex flex-wrap items-center gap-2">
            <TreeExportButtons filenameBase="visualizer-parse-tree" containerRef={treeExportRef} />
            <button
              onClick={() => setIsFocused(true)}
              className="flex items-center gap-2 rounded-full border border-border bg-white/80 px-3 py-2 text-sm text-muted-foreground transition-all duration-300 hover:bg-secondary hover:text-foreground"
            >
              <Expand className="h-4 w-4" />
              Focus Tree
            </button>
            <div className="flex items-center gap-2 rounded-full border border-border bg-white/80 px-3 py-2 text-sm text-muted-foreground">
              <span>Speed</span>
              <select
                value={playbackSpeed}
                onChange={event => setPlaybackSpeed(Number(event.target.value))}
                className="rounded-full border border-border bg-transparent px-2 py-0.5 text-sm text-foreground focus:outline-none"
              >
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
            </div>
          </div>
        </div>
        <div ref={treeExportRef} className="overflow-x-auto">
          <ParseTreeSVGFixed root={tree} visibleCount={visibleNodes} />
        </div>
        <p className="rounded-xl bg-[linear-gradient(180deg,rgba(255,255,199,0.52),rgba(255,255,255,0.94))] px-4 py-3 text-center text-[15px] text-foreground shadow-[0_14px_28px_-24px_rgba(84,134,135,0.72)]">
          {steps[stepIndex]}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setVisibleNodes(count => Math.max(1, count - 1))}
            disabled={visibleNodes <= 1}
            className="rounded-lg bg-muted px-4 py-2 text-[15px] font-medium text-muted-foreground transition-all duration-300 hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
          >
            Previous
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(current => !current)}
              className="flex items-center gap-2 rounded-lg border border-border bg-white/80 px-4 py-2 text-[15px] font-medium text-muted-foreground transition-all duration-300 hover:bg-secondary hover:text-foreground"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? 'Pause' : 'Autoplay'}
            </button>
            <button
              onClick={() => {
                setVisibleNodes(1);
                setIsPlaying(false);
              }}
              className="rounded-lg px-4 py-2 text-[15px] font-medium text-muted-foreground transition-all duration-300 hover:text-foreground"
            >
              Restart
            </button>
          </div>
          <button
            onClick={() => setVisibleNodes(count => Math.min(totalNodes, count + 1))}
            disabled={visibleNodes >= totalNodes}
            className="rounded-lg bg-muted px-4 py-2 text-[15px] font-medium text-muted-foreground transition-all duration-300 hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </motion.div>

      {isFocused ? (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm">
          <div className="flex h-full w-full flex-col p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/70">Focused View</p>
                <h3 className="text-lg font-medium">Generated Parse Tree</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFocused(false)}
                  className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm transition-all duration-300 hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto rounded-[28px] border border-white/15 bg-white p-4 shadow-2xl">
              <ParseTreeSVGFixed root={tree} visibleCount={visibleNodes} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function TreeExportButtons({
  filenameBase,
  containerRef,
}: {
  filenameBase: string;
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={async () => {
          try {
            const svg = containerRef.current?.querySelector('svg');
            if (svg instanceof SVGSVGElement) {
              await exportSvgElementAsPng(svg, `${filenameBase}.png`);
            }
          } catch (error) {
            window.alert(error instanceof Error ? error.message : 'Image export failed.');
          }
        }}
        className="flex items-center gap-2 rounded-full border border-border bg-white/80 px-3 py-2 text-sm text-muted-foreground transition-all duration-300 hover:bg-secondary hover:text-foreground"
      >
        <Download className="h-4 w-4" />
        Image
      </button>
    </div>
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
