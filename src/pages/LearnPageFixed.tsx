import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface Concept {
  id: string;
  title: string;
  shortTitle: string;
  category: string;
  categoryColor: string;
  summary: string;
  definition: string;
  example: string;
}

const concepts: Concept[] = [
  {
    id: 'cfg',
    title: 'Context-Free Grammar (CFG)',
    shortTitle: 'CFG',
    category: 'Foundation',
    categoryColor: 'bg-primary text-primary-foreground',
    summary: 'A formal grammar where each rule expands a single non-terminal into a new string of symbols.',
    definition: 'A context-free grammar is a 4-tuple G = (V, T, P, S) where V is the set of non-terminals, T is the set of terminals, P is the set of production rules, and S is the start symbol.',
    example: 'S -> a S b | ε\nThis grammar generates strings like ε, ab, aabb, aaabbb.',
  },
  {
    id: 'nonterminal',
    title: 'Non-terminal',
    shortTitle: 'Non-terminal',
    category: 'Components',
    categoryColor: 'bg-primary/80 text-primary-foreground',
    summary: 'A replaceable symbol that can still be expanded using the grammar.',
    definition: 'Non-terminals are grammar variables such as S, A, or Expr. They organize the structure of the language and appear on the left side of rules.',
    example: 'In S -> a A b, both S and A are non-terminals.',
  },
  {
    id: 'terminal',
    title: 'Terminal',
    shortTitle: 'Terminal',
    category: 'Components',
    categoryColor: 'bg-secondary text-secondary-foreground',
    summary: 'A final symbol that appears in the completed string.',
    definition: 'Terminals are the actual alphabet symbols of the language. They do not expand any further during a derivation.',
    example: 'In S -> a A b, the symbols a and b are terminals.',
  },
  {
    id: 'production',
    title: 'Production Rule',
    shortTitle: 'Production',
    category: 'Components',
    categoryColor: 'bg-secondary text-secondary-foreground',
    summary: 'A rule that tells us how one non-terminal may be rewritten.',
    definition: 'A production rule has the form A -> α where A is one non-terminal and α is a sequence of terminals and non-terminals, possibly ε.',
    example: 'E -> E + T | T\nThis means E may become either E + T or T.',
  },
  {
    id: 'derivation',
    title: 'Derivation',
    shortTitle: 'Derivation',
    category: 'Process',
    categoryColor: 'bg-primary text-primary-foreground',
    summary: 'A sequence of rule applications starting from the start symbol.',
    definition: 'A derivation shows how the grammar transforms the start symbol step by step into a sentence made only of terminals.',
    example: 'S => a S b => a a S b b => a a b b',
  },
  {
    id: 'leftmost',
    title: 'Leftmost Derivation',
    shortTitle: 'Leftmost',
    category: 'Process',
    categoryColor: 'bg-primary/80 text-primary-foreground',
    summary: 'At each step, the leftmost non-terminal is expanded first.',
    definition: 'A leftmost derivation fixes the expansion order by always rewriting the first non-terminal from the left.',
    example: 'E => E + T => T + T => id + T => id + id',
  },
  {
    id: 'rightmost',
    title: 'Rightmost Derivation',
    shortTitle: 'Rightmost',
    category: 'Process',
    categoryColor: 'bg-primary/80 text-primary-foreground',
    summary: 'At each step, the rightmost non-terminal is expanded first.',
    definition: 'A rightmost derivation follows the same grammar but always chooses the last non-terminal in the current sentential form.',
    example: 'E => E + T => E + id => T + id => id + id',
  },
  {
    id: 'parsetree',
    title: 'Parse Tree',
    shortTitle: 'Parse Tree',
    category: 'Visualization',
    categoryColor: 'bg-secondary text-secondary-foreground',
    summary: 'A tree that shows the hierarchical structure behind a derivation.',
    definition: 'A parse tree places the start symbol at the root, uses internal nodes for non-terminals, and uses leaves for terminals or ε.',
    example: 'For E -> E + T | T, the string id + id forms a tree with E at the root and leaves id, +, id.',
  },
  {
    id: 'sentential',
    title: 'Sentential Form',
    shortTitle: 'Sentential Form',
    category: 'Concept',
    categoryColor: 'bg-muted text-muted-foreground',
    summary: 'Any intermediate string obtained during a derivation.',
    definition: 'A sentential form may contain both terminals and non-terminals. It becomes a sentence only when every symbol is terminal.',
    example: 'In S => a S b => a a S b b => a a b b, the strings a S b and a a S b b are sentential forms.',
  },
  {
    id: 'ambiguous',
    title: 'Ambiguous Grammar',
    shortTitle: 'Ambiguous',
    category: 'Concept',
    categoryColor: 'bg-muted text-muted-foreground',
    summary: 'A grammar that can produce multiple valid parse trees for the same string.',
    definition: 'A CFG is ambiguous if one sentence in the language has two or more distinct derivations or parse trees.',
    example: 'E -> E + E | E * E | id\nThe string id + id * id can be parsed in more than one way.',
  },
  {
    id: 'language',
    title: 'Language of a Grammar',
    shortTitle: 'Language',
    category: 'Foundation',
    categoryColor: 'bg-primary text-primary-foreground',
    summary: 'The full set of terminal strings that the grammar can generate.',
    definition: 'The language of G is written L(G) = { w in T* | S =>* w }, meaning all terminal strings derivable from S.',
    example: 'For S -> a S b | ε, the language is { ε, ab, aabb, aaabbb, ... }.',
  },
  {
    id: 'yield',
    title: 'Yield',
    shortTitle: 'Yield',
    category: 'Visualization',
    categoryColor: 'bg-secondary text-secondary-foreground',
    summary: 'The terminal string read from the leaves of a parse tree.',
    definition: 'The yield is obtained by reading all leaf nodes from left to right. For a complete parse tree, that yield is the generated string.',
    example: 'If the leaves are a, a, b, b from left to right, the yield is aabb.',
  },
];

const grammarCards = [
  ['V', 'Variables', 'Non-terminals that hold the recursive structure of the language.'],
  ['T', 'Terminals', 'Visible symbols that survive in the final generated string.'],
  ['P', 'Productions', 'Rules that authorize each legal replacement step.'],
  ['S', 'Start symbol', 'The unique entry point from which derivations begin.'],
];

const studyNotes = [
  ['Quick check', 'A valid sentence must contain only terminals when the derivation ends.'],
  ['Exam habit', 'Always mark which non-terminal you expanded to avoid losing track of leftmost versus rightmost order.'],
  ['Tree insight', 'Leaves give the yield, while internal nodes explain why the string has that structure.'],
];

export default function LearnPageFixed() {
  const [activeIdx, setActiveIdx] = useState(0);
  const slideRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback((idx: number) => {
    setActiveIdx(idx);
    slideRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const concept = concepts[activeIdx];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-12"
    >
      <section>
        <div className="mb-6 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-medium text-foreground">Key Concepts</h2>
        </div>

        <div className="mb-5 rounded-[28px] border border-border bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(255,255,199,0.72))] p-4 shadow-[0_22px_50px_-36px_rgba(84,134,135,0.9)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-primary/80">Concept Index</p>
            </div>
            <div className="hidden items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs text-primary sm:flex">
              <Sparkles className="h-3.5 w-3.5" />
              {activeIdx + 1} of {concepts.length}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6">
            {concepts.map((item, index) => (
              <button
                key={item.id}
                onClick={() => goTo(index)}
                className={`interactive-hover rounded-2xl border px-4 py-3 text-left transition-all duration-300 ${
                  activeIdx === index
                    ? 'border-primary bg-primary text-primary-foreground shadow-[0_18px_35px_-28px_rgba(84,134,135,1)]'
                    : 'border-border bg-card/90 text-foreground hover:border-primary/40 hover:bg-secondary/60'
                }`}
              >
                <div className={`mb-2 text-[11px] uppercase tracking-[0.18em] ${activeIdx === index ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="text-sm font-medium leading-snug">{item.shortTitle}</div>
              </button>
            ))}
          </div>
        </div>

        <div ref={slideRef} className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={concept.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(255,255,247,0.92))] shadow-[0_26px_60px_-42px_rgba(84,134,135,0.95)]"
            >
              <div className="h-1.5 bg-[linear-gradient(90deg,rgba(84,134,135,1),rgba(255,255,199,0.95),rgba(84,134,135,0.85))]" />

              <div className="p-8">
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <span className="font-mono text-2xl font-medium text-primary">
                      {String(activeIdx + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div>
                    <span className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${concept.categoryColor}`}>
                      {concept.category}
                    </span>
                    <h3 className="text-2xl font-medium text-foreground">{concept.title}</h3>
                  </div>
                </div>

                <p className="mb-6 border-l-2 border-primary pl-4 text-base leading-relaxed text-foreground">
                  {concept.summary}
                </p>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="interactive-hover rounded-xl border border-border/50 bg-[linear-gradient(180deg,rgba(247,247,240,0.78),rgba(255,255,255,0.96))] p-5 shadow-[0_18px_35px_-34px_rgba(84,134,135,0.8)] transition-all duration-300">
                    <h4 className="mb-2 text-sm font-medium text-primary">Formal Definition</h4>
                    <p className="text-sm leading-[1.8] text-foreground">{concept.definition}</p>
                  </div>
                  <div className="interactive-hover rounded-xl border border-primary/10 bg-[linear-gradient(180deg,rgba(255,255,199,0.72),rgba(255,255,255,0.96))] p-5 shadow-[0_18px_35px_-34px_rgba(84,134,135,0.8)] transition-all duration-300">
                    <h4 className="mb-2 text-sm font-medium text-primary">Example</h4>
                    <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground">{concept.example}</pre>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border bg-muted/20 px-8 py-4">
                <button
                  onClick={() => goTo(Math.max(0, activeIdx - 1))}
                  disabled={activeIdx === 0}
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <div className="flex gap-1">
                  {concepts.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goTo(index)}
                      className={`rounded-full transition-all duration-300 ${
                        index === activeIdx ? 'h-2 w-6 bg-primary' : 'h-2 w-2 bg-border hover:bg-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => goTo(Math.min(concepts.length - 1, activeIdx + 1))}
                  disabled={activeIdx === concepts.length - 1}
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,255,240,0.94))] shadow-[0_30px_70px_-48px_rgba(84,134,135,0.95)]">
        <div className="grid gap-8 p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-4 text-left">
            <p className="text-xs uppercase tracking-[0.24em] text-primary/80">Grammar Components</p>
            <h2 className="text-2xl font-medium text-foreground">How a CFG is assembled</h2>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground">
              A context-free grammar is more than a formula. It is a small system: symbols that can grow, symbols that stay fixed, rules that control expansion, and a single place to begin.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {grammarCards.map(([symbol, label, text]) => (
                <div
                  key={symbol}
                  className="interactive-hover rounded-2xl border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,247,240,0.78))] p-4 shadow-[0_16px_36px_-34px_rgba(84,134,135,0.85)] transition-all duration-300 hover:border-primary/40 hover:bg-secondary/40"
                >
                  <div className="mb-2 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 font-mono text-base text-primary">
                      {symbol}
                    </span>
                    <h3 className="text-sm font-medium text-foreground">{label}</h3>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-primary/15 bg-[radial-gradient(circle_at_top,rgba(255,255,199,0.98),rgba(247,247,240,0.82)_45%,rgba(255,255,255,0.98))] p-6 shadow-[0_28px_60px_-42px_rgba(84,134,135,0.95)] interactive-hover transition-all duration-300">
            <svg viewBox="0 0 620 380" className="w-full">
              <path d="M150 96 H255" stroke="hsl(var(--border))" strokeWidth="2.5" strokeDasharray="8 8" />
              <path d="M365 96 H470" stroke="hsl(var(--border))" strokeWidth="2.5" strokeDasharray="8 8" />
              <path d="M310 140 V188" stroke="hsl(var(--border))" strokeWidth="2.5" strokeDasharray="8 8" />
              <text x="310" y="330" textAnchor="middle" className="font-mono fill-foreground" style={{ fontSize: '24px', fontWeight: 500 }}>
                G = ( V, T, P, S )
              </text>

              {[
                { x: 45, y: 48, w: 110, h: 92, label: 'V', sub: 'Variables', fill: 'hsl(var(--teal) / 0.14)' },
                { x: 255, y: 48, w: 110, h: 92, label: 'T', sub: 'Terminals', fill: 'hsl(var(--yellow))' },
                { x: 465, y: 48, w: 110, h: 92, label: 'P', sub: 'Rules', fill: 'hsl(210 40% 96%)' },
                { x: 255, y: 188, w: 110, h: 92, label: 'S', sub: 'Start', fill: 'hsl(var(--teal) / 0.14)' },
              ].map(item => (
                <g key={item.label}>
                  <rect
                    x={item.x}
                    y={item.y}
                    width={item.w}
                    height={item.h}
                    rx={22}
                    fill={item.fill}
                    stroke="hsl(var(--teal))"
                    strokeWidth="2"
                  />
                  <text x={item.x + item.w / 2} y={item.y + 38} textAnchor="middle" className="font-mono fill-foreground" style={{ fontSize: '28px', fontWeight: 500 }}>
                    {item.label}
                  </text>
                  <text x={item.x + item.w / 2} y={item.y + 62} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: '12px' }}>
                    {item.sub}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,255,245,0.93))] p-8 shadow-[0_28px_60px_-46px_rgba(84,134,135,0.95)]">
        <h2 className="mb-6 text-center text-lg font-medium text-foreground">Leftmost vs Rightmost Derivation</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <DerivationExample
            title="Leftmost Derivation"
            steps={[
              { form: ['E'], highlighted: -1 },
              { form: ['E', '+', 'T'], highlighted: 0 },
              { form: ['T', '+', 'T'], highlighted: 0 },
              { form: ['id', '+', 'T'], highlighted: 0 },
              { form: ['id', '+', 'id'], highlighted: 2 },
            ]}
          />
          <DerivationExample
            title="Rightmost Derivation"
            steps={[
              { form: ['E'], highlighted: -1 },
              { form: ['E', '+', 'T'], highlighted: 0 },
              { form: ['E', '+', 'id'], highlighted: 2 },
              { form: ['T', '+', 'id'], highlighted: 0 },
              { form: ['id', '+', 'id'], highlighted: 0 },
            ]}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,247,240,0.95))] p-8 shadow-[0_24px_54px_-44px_rgba(84,134,135,0.92)]">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.24em] text-primary/80">Study Notes</p>
          <h2 className="mt-2 text-xl font-medium text-foreground">Small theory points worth remembering</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {studyNotes.map(([title, body]) => (
            <div
              key={title}
              className="interactive-hover rounded-2xl border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,255,199,0.42))] p-5 shadow-[0_18px_40px_-34px_rgba(84,134,135,0.86)] transition-all duration-300"
            >
              <h3 className="mb-2 text-sm font-medium text-primary">{title}</h3>
              <p className="text-sm leading-6 text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

function DerivationExample({
  title,
  steps,
}: {
  title: string;
  steps: { form: string[]; highlighted: number }[];
}) {
  const [step, setStep] = useState(0);
  const current = steps[step];

  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium text-primary">{title}</h3>
      <div className="interactive-hover rounded-xl bg-[linear-gradient(180deg,rgba(247,247,240,0.74),rgba(255,255,255,0.96))] p-4 shadow-[0_18px_34px_-30px_rgba(84,134,135,0.82)] transition-all duration-300">
        <div className="space-y-3">
          {steps.slice(0, step + 1).map((item, visibleIndex) => {
            const isCurrent = visibleIndex === step;

            return (
              <motion.div
                key={`${title}-${visibleIndex}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`rounded-xl border px-4 py-3 ${
                  isCurrent
                    ? 'border-primary/40 bg-secondary/55 shadow-[0_16px_30px_-24px_rgba(84,134,135,0.9)]'
                    : 'border-border/70 bg-white/72'
                }`}
              >
                <div className="mb-2 flex items-center gap-3">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                    isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {visibleIndex + 1}
                  </span>
                  {visibleIndex > 0 ? <span className="font-mono text-xs text-primary">{isCurrent ? 'Current step' : 'Previous step'}</span> : <span className="font-mono text-xs text-muted-foreground">Start</span>}
                </div>
                <div className="flex flex-wrap items-center gap-1 font-mono text-lg">
                  {item.form.map((symbol, index) => (
                    <motion.span
                      key={`${visibleIndex}-${index}`}
                      initial={isCurrent ? { opacity: 0, scale: 1.12 } : false}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25 }}
                      className={`rounded-md px-2 py-1 transition-all duration-300 ${
                        isCurrent && index === item.highlighted
                          ? 'border border-primary bg-secondary font-medium text-foreground'
                          : isCurrent
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {symbol}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="rounded-lg bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-xs text-muted-foreground">
          Step {step + 1} / {steps.length}
        </span>
        <button
          onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
          disabled={step === steps.length - 1}
          className="rounded-lg bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
