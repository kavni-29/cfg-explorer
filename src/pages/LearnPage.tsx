import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

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
    summary: 'A formal grammar where every production rule has a single non-terminal on the left side.',
    definition: 'A context-free grammar is a 4-tuple G = (V, T, P, S) where V is a finite set of non-terminals, T is a finite set of terminals, P is a finite set of production rules, and S ∈ V is the start symbol.',
    example: 'S → aSb | ε\nThis generates the language {aⁿbⁿ | n ≥ 0}',
  },
  {
    id: 'nonterminal',
    title: 'Non-terminal',
    shortTitle: 'Non-terminal',
    category: 'Components',
    categoryColor: 'bg-primary/80 text-primary-foreground',
    summary: 'A symbol that can be replaced by a sequence of other symbols using production rules.',
    definition: 'Non-terminals (also called variables) are symbols that represent sets of strings. They appear on the left-hand side of production rules and can be expanded during derivation.',
    example: 'In S → aAb, both S and A are non-terminals.',
  },
  {
    id: 'terminal',
    title: 'Terminal',
    shortTitle: 'Terminal',
    category: 'Components',
    categoryColor: 'bg-secondary text-secondary-foreground',
    summary: 'A symbol that appears in the final derived string and cannot be further expanded.',
    definition: 'Terminals are the alphabet symbols that form the actual strings of the language. They never appear on the left side of production rules.',
    example: 'In S → aAb, the symbols a and b are terminals.',
  },
  {
    id: 'production',
    title: 'Production Rule',
    shortTitle: 'Production',
    category: 'Components',
    categoryColor: 'bg-secondary text-secondary-foreground',
    summary: 'A rule specifying how a non-terminal can be replaced by a sequence of symbols.',
    definition: 'A production rule has the form A → α, where A is a single non-terminal and α is a string of terminals and non-terminals (possibly empty).',
    example: 'E → E + T | T\nHere E can be replaced by either "E + T" or "T".',
  },
  {
    id: 'derivation',
    title: 'Derivation',
    shortTitle: 'Derivation',
    category: 'Process',
    categoryColor: 'bg-primary text-primary-foreground',
    summary: 'The process of repeatedly applying production rules starting from the start symbol.',
    definition: 'A derivation is a sequence of rule applications that transforms the start symbol into a string of terminals. Each step replaces one non-terminal using a matching production rule.',
    example: 'S ⇒ aSb ⇒ aaSbb ⇒ aabb',
  },
  {
    id: 'leftmost',
    title: 'Leftmost Derivation',
    shortTitle: 'Leftmost',
    category: 'Process',
    categoryColor: 'bg-primary/80 text-primary-foreground',
    summary: 'A derivation that always expands the leftmost non-terminal first.',
    definition: 'In a leftmost derivation, at each step, the leftmost non-terminal in the sentential form is the one that gets replaced. This gives a unique derivation order for unambiguous grammars.',
    example: 'E ⇒ E+T ⇒ T+T ⇒ F+T ⇒ id+T ⇒ id+F ⇒ id+id',
  },
  {
    id: 'rightmost',
    title: 'Rightmost Derivation',
    shortTitle: 'Rightmost',
    category: 'Process',
    categoryColor: 'bg-primary/80 text-primary-foreground',
    summary: 'A derivation that always expands the rightmost non-terminal first.',
    definition: 'In a rightmost derivation, at each step, the rightmost non-terminal in the sentential form is the one that gets replaced. Also called canonical derivation.',
    example: 'E ⇒ E+T ⇒ E+F ⇒ E+id ⇒ T+id ⇒ F+id ⇒ id+id',
  },
  {
    id: 'parsetree',
    title: 'Parse Tree',
    shortTitle: 'Parse Tree',
    category: 'Visualization',
    categoryColor: 'bg-secondary text-secondary-foreground',
    summary: 'A tree representation showing the hierarchical structure of a derivation.',
    definition: 'A parse tree (or derivation tree) has the start symbol as root, non-terminals as internal nodes, and terminals (or ε) as leaves. Each internal node and its children represent a production rule application.',
    example: 'The parse tree for "id + id" with E → E + T | T has E at the root with children E, +, T.',
  },
  {
    id: 'sentential',
    title: 'Sentential Form',
    shortTitle: 'Sentential Form',
    category: 'Concept',
    categoryColor: 'bg-muted text-muted-foreground',
    summary: 'Any string of terminals and non-terminals derivable from the start symbol.',
    definition: 'A sentential form is any intermediate string in a derivation. It may contain both terminals and non-terminals. When it contains only terminals, it is called a sentence.',
    example: 'In S ⇒ aSb ⇒ aaSbb ⇒ aabb:\n"aSb" and "aaSbb" are sentential forms.',
  },
  {
    id: 'ambiguous',
    title: 'Ambiguous Grammar',
    shortTitle: 'Ambiguous',
    category: 'Concept',
    categoryColor: 'bg-muted text-muted-foreground',
    summary: 'A grammar that produces more than one parse tree for some string.',
    definition: 'A CFG is ambiguous if there exists at least one string in the language for which two or more distinct leftmost (or rightmost) derivations exist, resulting in different parse trees.',
    example: 'E → E + E | E * E | id\nis ambiguous because "id + id * id" has two parse trees.',
  },
  {
    id: 'language',
    title: 'Language of a Grammar',
    shortTitle: 'Language',
    category: 'Foundation',
    categoryColor: 'bg-primary text-primary-foreground',
    summary: 'The set of all strings of terminals derivable from the start symbol.',
    definition: 'L(G) = {w ∈ T* | S ⇒* w}, the set of all terminal strings that can be derived from the start symbol through zero or more derivation steps.',
    example: 'For S → aSb | ε:\nL(G) = {ε, ab, aabb, aaabbb, …} = {aⁿbⁿ | n ≥ 0}',
  },
  {
    id: 'yield',
    title: 'Yield',
    shortTitle: 'Yield',
    category: 'Visualization',
    categoryColor: 'bg-secondary text-secondary-foreground',
    summary: 'The string formed by reading the leaves of a parse tree from left to right.',
    definition: 'The yield (or frontier) of a parse tree is obtained by concatenating all leaf labels from left to right. For a complete derivation, the yield is a string in the language.',
    example: 'A parse tree with leaves [a, a, b, b] has yield "aabb".',
  },
];

export default function LearnPage() {
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
      {/* Section 1: Concept Slides */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-medium text-foreground">Key Concepts</h2>
        </div>

        {/* Index nav — scrollable pill bar */}
        <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          {concepts.map((c, i) => (
            <button
              key={c.id}
              onClick={() => goTo(i)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeIdx === i
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {c.shortTitle}
            </button>
          ))}
        </div>

        {/* Slide card */}
        <div ref={slideRef} className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={concept.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="bg-card rounded-2xl border border-border overflow-hidden"
            >
              {/* Top accent strip */}
              <div className="h-1.5 bg-primary" />

              <div className="p-8">
                {/* Category + title */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-mono font-medium text-primary">
                      {String(activeIdx + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium mb-2 ${concept.categoryColor}`}>
                      {concept.category}
                    </span>
                    <h3 className="text-2xl font-medium text-foreground">{concept.title}</h3>
                  </div>
                </div>

                {/* Summary */}
                <p className="text-base text-foreground leading-relaxed mb-6 border-l-2 border-primary pl-4">
                  {concept.summary}
                </p>

                {/* Definition + Example side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-muted/30 rounded-xl p-5">
                    <h4 className="text-sm font-medium text-primary mb-2">Formal Definition</h4>
                    <p className="text-sm text-foreground leading-[1.8]">{concept.definition}</p>
                  </div>
                  <div className="bg-secondary/30 rounded-xl p-5">
                    <h4 className="text-sm font-medium text-primary mb-2">Example</h4>
                    <pre className="font-mono text-sm text-foreground whitespace-pre-wrap leading-relaxed">{concept.example}</pre>
                  </div>
                </div>
              </div>

              {/* Bottom nav */}
              <div className="flex items-center justify-between px-8 py-4 border-t border-border bg-muted/20">
                <button
                  onClick={() => goTo(Math.max(0, activeIdx - 1))}
                  disabled={activeIdx === 0}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground disabled:opacity-40 transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <div className="flex gap-1">
                  {concepts.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        i === activeIdx ? 'bg-primary w-6' : 'bg-border hover:bg-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => goTo(Math.min(concepts.length - 1, activeIdx + 1))}
                  disabled={activeIdx === concepts.length - 1}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground disabled:opacity-40 transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Section 2: Grammar Components Diagram */}
      <section className="bg-card rounded-2xl border border-border p-8">
        <h2 className="text-lg font-medium text-foreground mb-6 text-center">Grammar Components</h2>
        <svg viewBox="0 0 700 120" className="w-full max-w-2xl mx-auto">
          {[
            { label: 'V', sub: 'Variables', x: 80, color: 'hsl(var(--teal))' },
            { label: 'T', sub: 'Terminals', x: 240, color: 'hsl(var(--yellow))' },
            { label: 'P', sub: 'Productions', x: 400, color: 'hsl(210,40%,96%)' },
            { label: 'S', sub: 'Start Symbol', x: 560, color: 'hsl(var(--teal))' },
          ].map((item, i) => (
            <g key={i}>
              <rect
                x={item.x - 50}
                y={15}
                width={100}
                height={55}
                rx={12}
                fill={item.color}
                stroke="hsl(var(--teal))"
                strokeWidth={2}
              />
              <text x={item.x} y={42} textAnchor="middle" className="font-mono text-lg fill-foreground" fontWeight={500}>
                {item.label}
              </text>
              <text x={item.x} y={58} textAnchor="middle" className="text-[10px] fill-muted-foreground">
                {item.sub}
              </text>
              {i < 3 && (
                <text x={item.x + 80} y={48} textAnchor="middle" className="text-xl fill-muted-foreground">
                  ,
                </text>
              )}
            </g>
          ))}
          <text x={350} y={105} textAnchor="middle" className="font-mono text-base fill-foreground" fontWeight={500}>
            G = ( V, T, P, S )
          </text>
        </svg>
      </section>

      {/* Section 3: Leftmost vs Rightmost comparison */}
      <section className="bg-card rounded-2xl border border-border p-8">
        <h2 className="text-lg font-medium text-foreground mb-6 text-center">
          Leftmost vs Rightmost Derivation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      <div className="bg-muted/30 rounded-xl p-4 min-h-[60px] flex items-center justify-center">
        <div className="flex items-center gap-1 font-mono text-lg">
          {current.form.map((sym, i) => (
            <motion.span
              key={`${step}-${i}`}
              initial={{ opacity: 0, scale: 1.18 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`px-2 py-1 rounded-md transition-all duration-300 ${
                i === current.highlighted
                  ? 'bg-secondary border border-primary text-foreground font-medium'
                  : ''
              }`}
            >
              {sym}
            </motion.span>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-muted text-muted-foreground disabled:opacity-40 transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
        >
          Previous
        </button>
        <span className="text-xs text-muted-foreground">
          Step {step + 1} / {steps.length}
        </span>
        <button
          onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
          disabled={step === steps.length - 1}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-muted text-muted-foreground disabled:opacity-40 transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
        >
          Next
        </button>
      </div>
    </div>
  );
}
