import { type RefObject, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Download, Pause, Play, Sparkles } from 'lucide-react';
import ParseTreeSVGFixed from '@/components/ParseTreeSVGFixed';
import {
  EXAMPLES,
  buildParseTree,
  derive,
  parseGrammar,
  type DerivationStep,
} from '@/lib/cfg-engine-fixed';
import type { DerivationType, GeneratorState } from './Index';
import { exportSvgElementAsPng, exportSvgMarkupAsPng, buildDerivationSvgMarkup } from '@/lib/export-utils';

interface GeneratorPageProps {
  state: GeneratorState;
  onStateChange: React.Dispatch<React.SetStateAction<GeneratorState>>;
}

function getStepExplanation(step: DerivationStep, index: number) {
  if (index === 0) {
    return 'The derivation opens at the start symbol, which acts as the root idea from which the whole sentence will unfold.';
  }

  if (step.expandedSymbol === null) {
    return 'This frame marks the setup moment before any replacement is applied.';
  }

  const replacement = step.replacement.join(' ');
  return `At this moment, ${step.expandedSymbol} is the chosen non-terminal. Applying ${step.ruleUsed} rewrites it as ${replacement}, which pushes the sentential form one step closer to the target string.`;
}

export default function GeneratorPageEnhanced({ state, onStateChange }: GeneratorPageProps) {
  const parseTreeExportRef = useRef<HTMLDivElement | null>(null);
  const {
    activeExample,
    derivationType,
    error,
    grammarText,
    inputString,
    leftSteps,
    parseTree,
    rightSteps,
  } = state;

  function handleExampleClick(name: string) {
    const example = EXAMPLES[name];
    onStateChange(current => ({
      ...current,
      activeExample: name,
      grammarText: example.grammar,
      inputString: example.input,
      parsedGrammar: null,
      leftSteps: null,
      rightSteps: null,
      parseTree: null,
      error: '',
    }));
  }

  function updateState(patch: Partial<GeneratorState>) {
    onStateChange(current => ({ ...current, ...patch }));
  }

  function handleGenerate() {
    try {
      const grammar = parseGrammar(grammarText);
      if (grammar.rules.length === 0) {
        updateState({
          parsedGrammar: null,
          leftSteps: null,
          rightSteps: null,
          parseTree: null,
          error: 'No valid grammar rules found. Use a rule like: S -> a S b | ε',
        });
        return;
      }

      let nextLeftSteps: DerivationStep[] | null = null;
      let nextRightSteps: DerivationStep[] | null = null;
      let nextParseTree = null;
      let nextError = '';

      if (derivationType === 'leftmost' || derivationType === 'both') {
        nextLeftSteps = derive(grammar, inputString, 'leftmost');
        if (!nextLeftSteps && derivationType === 'leftmost') {
          nextError = 'Could not derive that input with a leftmost derivation.';
        } else if (nextLeftSteps) {
          nextParseTree = buildParseTree(grammar, nextLeftSteps);
        }
      }

      if (!nextError && (derivationType === 'rightmost' || derivationType === 'both')) {
        nextRightSteps = derive(grammar, inputString, 'rightmost');
        if (!nextRightSteps && derivationType === 'rightmost') {
          nextError = 'Could not derive that input with a rightmost derivation.';
        } else if (nextRightSteps && !nextParseTree) {
          nextParseTree = buildParseTree(grammar, nextRightSteps);
        }
      }

      if (!nextError && derivationType === 'both' && !nextLeftSteps && !nextRightSteps) {
        nextError = 'Could not derive that input string from the grammar you entered.';
      }

      updateState({
        parsedGrammar: grammar,
        leftSteps: nextLeftSteps,
        rightSteps: nextRightSteps,
        parseTree: nextParseTree,
        error: nextError,
      });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'An unexpected parsing error occurred.';
      updateState({
        parsedGrammar: null,
        leftSteps: null,
        rightSteps: null,
        parseTree: null,
        error: message,
      });
    }
  }

  const hasResults = Boolean(leftSteps || rightSteps);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-8"
    >
      <div className="rounded-[28px] border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,255,243,0.94))] p-7 shadow-[0_30px_70px_-46px_rgba(84,134,135,0.95)] space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-primary/80">Generator Workspace</p>
          <h2 className="text-2xl font-medium text-foreground">Build a derivation from your grammar</h2>
          <p className="text-[15px] leading-7 text-muted-foreground">
            Enter a grammar, try one of the examples, and generate the derivation steps and parse tree for any string you want to test.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.keys(EXAMPLES).map(name => (
            <button
              key={name}
              onClick={() => handleExampleClick(name)}
              className={`chip ${activeExample === name ? 'chip-active' : ''}`}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[15px] font-medium text-foreground">Grammar Rules</label>
            <textarea
              value={grammarText}
              onChange={event =>
                updateState({
                  grammarText: event.target.value,
                  activeExample: 'Custom grammar',
                  error: '',
                })
              }
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
                onChange={event =>
                  updateState({
                    inputString: event.target.value,
                    activeExample: 'Custom grammar',
                    error: '',
                  })
                }
                className="w-full rounded-2xl border border-border px-4 py-3 font-mono text-[15px] text-foreground transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="aabb or a a b b"
              />
              <p className="text-sm text-muted-foreground">Spaces are optional for single-character tokens.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[15px] font-medium text-foreground">Derivation Type</label>
              <div className="flex gap-2">
                {(['leftmost', 'rightmost', 'both'] as DerivationType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => updateState({ derivationType: type, error: '' })}
                    className={`chip text-sm capitalize ${derivationType === type ? 'chip-active' : ''}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,255,199,0.42))] p-4 shadow-[0_18px_40px_-34px_rgba(84,134,135,0.82)]">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                <p className="text-sm font-medium">Input tips</p>
              </div>
              <p className="mt-2 text-[15px] leading-7 text-muted-foreground">
                Use one production per line, keep every non-terminal on the left side of a rule, and use <span className="font-mono text-foreground">ε</span> for the empty string.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={handleGenerate} className="btn-generate flex items-center gap-2">
            <Play className="h-4 w-4" />
            Generate
          </button>
          {error ? <p className="text-[15px] text-destructive">{error}</p> : null}
        </div>
      </div>

      <AnimatePresence>
        {hasResults ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            {leftSteps && rightSteps ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,247,240,0.92))] p-6 shadow-[0_24px_50px_-40px_rgba(84,134,135,0.9)]">
                  <DerivationStepper steps={leftSteps} label="Leftmost Derivation" />
                </div>
                <div className="rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,247,240,0.92))] p-6 shadow-[0_24px_50px_-40px_rgba(84,134,135,0.9)]">
                  <DerivationStepper steps={rightSteps} label="Rightmost Derivation" />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,247,240,0.92))] p-6 shadow-[0_24px_50px_-40px_rgba(84,134,135,0.9)]">
                <DerivationStepper
                  steps={leftSteps || rightSteps}
                  label={leftSteps ? 'Leftmost Derivation' : 'Rightmost Derivation'}
                />
              </div>
            )}

            {parseTree ? (
              <div className="rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,255,240,0.94))] p-6 shadow-[0_24px_50px_-40px_rgba(84,134,135,0.9)]">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-xl font-medium text-foreground">Parse Tree</h3>
                  <TreeExportButtons filenameBase="generator-parse-tree" containerRef={parseTreeExportRef} />
                </div>
                <div ref={parseTreeExportRef} className="overflow-x-auto">
                  <ParseTreeSVGFixed root={parseTree} />
                </div>
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

function DerivationStepper({ steps, label }: { steps: DerivationStep[] | null; label: string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, [steps, label]);

  if (!steps?.length) {
    return <p className="text-[15px] text-muted-foreground">No derivation available.</p>;
  }

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      setCurrentStep(step => Math.min(steps.length - 1, step + 1));
    }, 1200 / playbackSpeed);

    return () => window.clearTimeout(timeout);
  }, [currentStep, isPlaying, playbackSpeed, steps.length]);

  const activeStep = steps[currentStep];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-primary">{label}</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              const markup = buildDerivationSvgMarkup(label, steps.map(step => ({
                sententialForm: step.sententialForm,
                ruleUsed: step.ruleUsed,
              })));
              await exportSvgMarkupAsPng(markup, 1120, Math.max(260, 36 * 2 + 94 + steps.length * 62), `${label.toLowerCase().replace(/\s+/g, '-')}.png`);
            }}
            className="flex items-center gap-2 rounded-full border border-border bg-white/80 px-3 py-2 text-sm text-muted-foreground transition-all duration-300 hover:bg-secondary hover:text-foreground"
          >
            <Download className="h-4 w-4" />
            Image
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
          <span className="text-[15px] text-muted-foreground">
            Step {currentStep + 1} / {steps.length}
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-0 rounded-xl border border-border/60 bg-[linear-gradient(180deg,rgba(247,247,240,0.74),rgba(255,255,255,0.96))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
          {steps.map((step, index) => {
            if (index > currentStep) {
              return null;
            }

            const isCurrent = index === currentStep;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex items-start gap-3 py-3 ${index < currentStep ? 'border-b border-border/50' : ''}`}
              >
                <span
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium transition-all duration-300 ${
                    isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1 font-mono text-[17px]">
                    {index > 0 ? <span className="mr-1 text-muted-foreground">⇒</span> : null}
                    {step.sententialForm.map((symbol, symbolIndex) => (
                      <motion.span
                        key={`${index}-${symbolIndex}`}
                        initial={isCurrent && symbolIndex === step.expandedIndex ? { scale: 1.18 } : undefined}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`rounded-md px-2 py-0.5 transition-all duration-300 ${
                          isCurrent && symbolIndex === step.expandedIndex
                            ? 'border-2 border-primary bg-secondary font-medium'
                            : isCurrent
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {symbol}
                      </motion.span>
                    ))}
                  </div>
                  <p className={`mt-1 font-mono text-sm transition-colors duration-300 ${isCurrent ? 'text-primary' : 'text-muted-foreground/60'}`}>
                    {step.ruleUsed}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          key={`explanation-${currentStep}`}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-xl border border-border/60 bg-[linear-gradient(155deg,rgba(255,255,255,0.98),rgba(255,255,199,0.42),rgba(255,255,255,0.96))] p-5 shadow-[0_18px_40px_-34px_rgba(84,134,135,0.82)]"
        >
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
              Step Spotlight
            </span>
            <p className="text-xs uppercase tracking-[0.18em] text-primary/80">Guided Explanation</p>
          </div>
          <h4 className="mt-3 text-lg font-medium text-foreground">
            {currentStep === 0 ? 'Where the derivation begins' : `What changes in step ${currentStep}`}
          </h4>
          <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
            {getStepExplanation(activeStep, currentStep)}
          </p>
          <div className="mt-4 rounded-xl border border-border/60 bg-white/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <p className="text-sm font-medium text-primary">Production in focus</p>
            <p className="mt-2 font-mono text-[15px] text-foreground">{activeStep.ruleUsed}</p>
          </div>
          <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-medium text-primary">Reading hint</p>
            <p className="mt-1 text-[14px] leading-6 text-muted-foreground">
              Watch the highlighted non-terminal in the step list. That token is the exact symbol being rewritten in this moment.
            </p>
          </div>
        </motion.div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => setCurrentStep(step => Math.max(0, step - 1))}
          disabled={currentStep === 0}
          className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2 text-[15px] font-medium text-muted-foreground transition-all duration-300 hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(current => !current)}
            className="flex items-center gap-2 rounded-lg border border-border bg-white/80 px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-secondary hover:text-foreground"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPlaying ? 'Pause' : 'Autoplay'}
          </button>
          <button
            onClick={() => {
              setCurrentStep(0);
              setIsPlaying(false);
            }}
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-300 hover:text-foreground"
          >
            Reset
          </button>
        </div>
        <button
          onClick={() => setCurrentStep(step => Math.min(steps.length - 1, step + 1))}
          disabled={currentStep === steps.length - 1}
          className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2 text-[15px] font-medium text-muted-foreground transition-all duration-300 hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function TreeExportButtons({
  filenameBase,
  containerRef,
}: {
  filenameBase: string;
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  async function handleImageExport() {
    const container = containerRef.current;
    const svg = container?.querySelector('svg');
    if (svg instanceof SVGSVGElement) {
      await exportSvgElementAsPng(svg, `${filenameBase}.png`);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={async () => {
          try {
            await handleImageExport();
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
