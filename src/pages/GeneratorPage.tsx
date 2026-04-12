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
  const [activeResultTab, setActiveResultTab] = useState<'leftmost' | 'rightmost'>('leftmost');

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
          setActiveResultTab('leftmost');
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
          if (derivationType === 'rightmost') setActiveResultTab('rightmost');
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
            {/* Derivation Stepper */}
            <div className="bg-card rounded-2xl border border-border p-6">
              {/* Tabs */}
              {(leftSteps && rightSteps) && (
                <div className="flex gap-2 mb-5">
                  <button
                    onClick={() => setActiveResultTab('leftmost')}
                    className={`nav-pill text-sm ${activeResultTab === 'leftmost' ? 'nav-pill-active' : 'nav-pill-inactive'}`}
                  >
                    Leftmost
                  </button>
                  <button
                    onClick={() => setActiveResultTab('rightmost')}
                    className={`nav-pill text-sm ${activeResultTab === 'rightmost' ? 'nav-pill-active' : 'nav-pill-inactive'}`}
                  >
                    Rightmost
                  </button>
                </div>
              )}

              <DerivationStepper
                steps={activeResultTab === 'leftmost' ? leftSteps : rightSteps}
                label={activeResultTab === 'leftmost' ? 'Leftmost Derivation' : 'Rightmost Derivation'}
              />
            </div>

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

  const step = steps[Math.min(currentStep, steps.length - 1)];

  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium text-primary">{label}</h3>

      {/* Current sentential form */}
      <div className="bg-muted/20 rounded-xl p-5 flex items-center justify-center min-h-[70px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-wrap items-center justify-center gap-1 font-mono text-lg"
          >
            {step.sententialForm.map((sym, i) => (
              <motion.span
                key={`${currentStep}-${i}`}
                initial={i === step.expandedIndex ? { scale: 1.18 } : {}}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`px-2.5 py-1 rounded-md transition-all duration-300 ${
                  i === step.expandedIndex
                    ? 'bg-secondary border-2 border-primary font-medium'
                    : ''
                }`}
              >
                {sym}
              </motion.span>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Rule used */}
      <p className="text-center text-sm text-muted-foreground font-mono">
        {step.ruleUsed}
      </p>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground disabled:opacity-40 transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        <span className="text-sm text-muted-foreground">
          Step {currentStep + 1} / {steps.length}
        </span>
        <button
          onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground disabled:opacity-40 transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Full sequence */}
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors duration-300">
          Show full derivation
        </summary>
        <div className="mt-3 code-block space-y-1">
          {steps.map((s, i) => (
            <div
              key={i}
              className={`${i === currentStep ? 'text-primary font-medium' : 'text-muted-foreground'}`}
            >
              {i > 0 && '⇒ '}
              {s.sententialForm.join(' ')}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
