import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import ParseTreeSVGFixed from '@/components/ParseTreeSVGFixed';
import {
  EXAMPLES,
  buildParseTree,
  derive,
  parseGrammar,
  type DerivationStep,
} from '@/lib/cfg-engine-fixed';
import type { DerivationType, GeneratorState } from './Index';

interface GeneratorPageProps {
  state: GeneratorState;
  onStateChange: React.Dispatch<React.SetStateAction<GeneratorState>>;
}

export default function GeneratorPageFixed({ state, onStateChange }: GeneratorPageProps) {
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
      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Grammar Rules</label>
            <textarea
              value={grammarText}
              onChange={event =>
                updateState({
                  grammarText: event.target.value,
                  activeExample: 'Custom grammar',
                  error: '',
                })
              }
              rows={6}
              className="w-full font-mono text-sm bg-muted/30 border border-border rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300 text-foreground placeholder:text-muted-foreground"
              placeholder="S -> a S b | ε"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Input String</label>
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
                className="w-full font-mono text-sm bg-muted/30 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300 text-foreground placeholder:text-muted-foreground"
                placeholder="aabb or a a b b"
              />
              <p className="text-xs text-muted-foreground">Spaces are optional for single-character tokens.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Derivation Type</label>
              <div className="flex gap-2">
                {(['leftmost', 'rightmost', 'both'] as DerivationType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => updateState({ derivationType: type, error: '' })}
                    className={`chip text-xs capitalize ${derivationType === type ? 'chip-active' : ''}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={handleGenerate} className="btn-generate flex items-center gap-2">
            <Play className="w-4 h-4" />
            Generate
          </button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card rounded-2xl border border-border p-6">
                  <DerivationStepper steps={leftSteps} label="Leftmost Derivation" />
                </div>
                <div className="bg-card rounded-2xl border border-border p-6">
                  <DerivationStepper steps={rightSteps} label="Rightmost Derivation" />
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border p-6">
                <DerivationStepper
                  steps={leftSteps || rightSteps}
                  label={leftSteps ? 'Leftmost Derivation' : 'Rightmost Derivation'}
                />
              </div>
            )}

            {parseTree ? (
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="text-lg font-medium text-foreground mb-4">Parse Tree</h3>
                <div className="overflow-x-auto">
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

  useEffect(() => {
    setCurrentStep(0);
  }, [steps, label]);

  if (!steps?.length) {
    return <p className="text-muted-foreground text-sm">No derivation available.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-primary">{label}</h3>
        <span className="text-sm text-muted-foreground">
          Step {currentStep + 1} / {steps.length}
        </span>
      </div>

      <div className="bg-muted/20 rounded-xl p-5 space-y-0 max-h-[420px] overflow-y-auto">
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
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                  isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {index}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1 font-mono text-base">
                  {index > 0 ? <span className="text-muted-foreground mr-1">⇒</span> : null}
                  {step.sententialForm.map((symbol, symbolIndex) => (
                    <motion.span
                      key={`${index}-${symbolIndex}`}
                      initial={isCurrent && symbolIndex === step.expandedIndex ? { scale: 1.18 } : undefined}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className={`px-2 py-0.5 rounded-md transition-all duration-300 ${
                        isCurrent && symbolIndex === step.expandedIndex
                          ? 'bg-secondary border-2 border-primary font-medium'
                          : isCurrent
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {symbol}
                    </motion.span>
                  ))}
                </div>
                <p className={`text-xs font-mono mt-1 transition-colors duration-300 ${isCurrent ? 'text-primary' : 'text-muted-foreground/60'}`}>
                  {step.ruleUsed}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentStep(step => Math.max(0, step - 1))}
          disabled={currentStep === 0}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground disabled:opacity-40 transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        <button
          onClick={() => setCurrentStep(0)}
          className="px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-all duration-300"
        >
          Reset
        </button>
        <button
          onClick={() => setCurrentStep(step => Math.min(steps.length - 1, step + 1))}
          disabled={currentStep === steps.length - 1}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground disabled:opacity-40 transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
