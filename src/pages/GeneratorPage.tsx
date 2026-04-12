import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  parseGrammar,
  derive,
  buildParseTree,
  EXAMPLES,
  type DerivationStep,
  type TreeNode,
} from '@/lib/cfg-engine';
import ParseTreeSVG from '@/components/ParseTreeSVG';

type DerivationType = 'leftmost' | 'rightmost' | 'both';

export default function GeneratorPage() {
  const [grammarText, setGrammarText] = useState(EXAMPLES['Arithmetic expressions'].grammar);
  const [inputString, setInputString] = useState(EXAMPLES['Arithmetic expressions'].input);
  const [derivationType, setDerivationType] = useState<DerivationType>('leftmost');
  const [activeExample, setActiveExample] = useState('Arithmetic expressions');

  const [leftSteps, setLeftSteps] = useState<DerivationStep[] | null>(null);
  const [rightSteps, setRightSteps] = useState<DerivationStep[] | null>(null);
  const [parseTree, setParseTree] = useState<TreeNode | null>(null);
  const [error, setError] = useState('');
  

  function handleExampleClick(name: string) {
    setActiveExample(name);
    const ex = EXAMPLES[name];
    setGrammarText(ex.grammar);
    setInputString(ex.input);
    setError('');
    setLeftSteps(null);
    setRightSteps(null);
    setParseTree(null);
  }

  function handleGenerate() {
    setError('');
    setLeftSteps(null);
    setRightSteps(null);
    setParseTree(null);

    try {
      const grammar = parseGrammar(grammarText);
      if (grammar.rules.length === 0) {
        setError('No valid grammar rules found. Use format: S → a S b | ε');
        return;
      }

      if (derivationType === 'leftmost' || derivationType === 'both') {
        const steps = derive(grammar, inputString, 'leftmost');
        if (steps) {
          setLeftSteps(steps);
          const tree = buildParseTree(grammar, steps);
          setParseTree(tree);
          
        } else if (derivationType === 'leftmost') {
          setError('Could not derive the input string with leftmost derivation. Check your grammar and input.');
          return;
        }
      }

      if (derivationType === 'rightmost' || derivationType === 'both') {
        const steps = derive(grammar, inputString, 'rightmost');
        if (steps) {
          setRightSteps(steps);
          if (!parseTree) {
            const tree = buildParseTree(grammar, steps);
            setParseTree(tree);
          }
          
        } else if (derivationType === 'rightmost') {
          setError('Could not derive the input string with rightmost derivation. Check your grammar and input.');
          return;
        }
      }

      if (derivationType === 'both' && !leftSteps && !rightSteps) {
        setError('Could not derive the input string. Check your grammar and input.');
      }
    } catch (e: any) {
      setError(e.message || 'An error occurred during parsing.');
    }
  }

  const hasResults = leftSteps || rightSteps;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-8"
    >
      {/* Input Panel */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        {/* Example chips */}
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
          {/* Grammar input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Grammar Rules</label>
            <textarea
              value={grammarText}
              onChange={e => setGrammarText(e.target.value)}
              rows={6}
              className="w-full font-mono text-sm bg-muted/30 border border-border rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300 text-foreground placeholder:text-muted-foreground"
              placeholder="S → a S b | ε"
            />
          </div>

          {/* Input string + derivation type */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Input String</label>
              <input
                type="text"
                value={inputString}
                onChange={e => setInputString(e.target.value)}
                className="w-full font-mono text-sm bg-muted/30 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300 text-foreground placeholder:text-muted-foreground"
                placeholder="a a b b"
              />
              <p className="text-xs text-muted-foreground">Separate symbols with spaces</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Derivation Type</label>
              <div className="flex gap-2">
                {(['leftmost', 'rightmost', 'both'] as DerivationType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setDerivationType(t)}
                    className={`chip text-xs capitalize ${derivationType === t ? 'chip-active' : ''}`}
                  >
                    {t}
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
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {hasResults && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            {/* Derivation Steppers — side by side when both available */}
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

            {/* Parse Tree */}
            {parseTree && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="text-lg font-medium text-foreground mb-4">Parse Tree</h3>
                <div className="overflow-x-auto">
                  <ParseTreeSVG root={parseTree} />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DerivationStepper({ steps, label }: { steps: DerivationStep[] | null; label: string }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!steps || steps.length === 0) {
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

      {/* Stacked derivation steps */}
      <div className="bg-muted/20 rounded-xl p-5 space-y-0 max-h-[420px] overflow-y-auto">
        {steps.map((s, i) => {
          if (i > currentStep) return null;
          const isCurrent = i === currentStep;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex items-start gap-3 py-3 ${
                i < currentStep ? 'border-b border-border/50' : ''
              }`}
            >
              {/* Step number */}
              <span
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                  isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i}
              </span>

              {/* Sentential form */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1 font-mono text-base">
                  {i > 0 && (
                    <span className="text-muted-foreground mr-1">⇒</span>
                  )}
                  {s.sententialForm.map((sym, j) => (
                    <motion.span
                      key={`${i}-${j}`}
                      initial={isCurrent && j === s.expandedIndex ? { scale: 1.18 } : {}}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className={`px-2 py-0.5 rounded-md transition-all duration-300 ${
                        isCurrent && j === s.expandedIndex
                          ? 'bg-secondary border-2 border-primary font-medium'
                          : isCurrent
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {sym}
                    </motion.span>
                  ))}
                </div>
                {/* Rule used label */}
                <p className={`text-xs font-mono mt-1 transition-colors duration-300 ${
                  isCurrent ? 'text-primary' : 'text-muted-foreground/60'
                }`}>
                  {s.ruleUsed}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground disabled:opacity-40 transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        <button
          onClick={() => setCurrentStep(0)}
          className="px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-all duration-300"
        >
          Reset
        </button>
        <button
          onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground disabled:opacity-40 transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
