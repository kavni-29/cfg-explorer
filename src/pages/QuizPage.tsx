import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, HelpCircle, RefreshCcw, XCircle } from 'lucide-react';

interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}

function shuffle<T>(items: T[]) {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function buildQuestion(prompt: string, correct: string, distractors: string[], explanation: string, id: string): QuizQuestion {
  const options = shuffle([correct, ...distractors]);
  return {
    id,
    prompt,
    options,
    answer: options.indexOf(correct),
    explanation,
  };
}

function buildQuestionSet(): QuizQuestion[] {
  const leafWordSets = [
    ['a', 'a', 'b', 'b'],
    ['id', '+', 'id'],
    ['the', 'cat', 'sees'],
    ['(', ')'],
  ];
  const randomLeaves = leafWordSets[Math.floor(Math.random() * leafWordSets.length)];
  const randomStart = shuffle(['S', 'E', 'Expr'])[0];

  const factories = [
    () =>
      buildQuestion(
        `Which symbol must appear as the root of every parse tree generated from a grammar with start symbol ${randomStart}?`,
        `The start symbol ${randomStart}`,
        ['Any terminal in the string', 'The first symbol on the right-hand side of a rule', 'The leftmost non-terminal expanded last'],
        'Every parse tree begins at the start symbol because every derivation starts there.',
        'root-symbol',
      ),
    () =>
      buildQuestion(
        'In a leftmost derivation, which non-terminal is expanded at each step?',
        'The leftmost available non-terminal',
        ['The deepest non-terminal', 'The rightmost available non-terminal', 'All non-terminals at once'],
        'A leftmost derivation always rewrites the first non-terminal from the left in the current sentential form.',
        'leftmost-rule',
      ),
    () =>
      buildQuestion(
        `If the terminal leaves of a parse tree read ${randomLeaves.join(' ')} from left to right, what is its yield?`,
        randomLeaves.join(' '),
        ['The internal nodes of the tree', randomLeaves.slice().reverse().join(' '), 'Only the root label'],
        'The yield is obtained by reading the leaf terminals from left to right.',
        'yield-order',
      ),
    () =>
      buildQuestion(
        'When is a grammar called ambiguous?',
        'When one string has two different valid parse trees',
        ['When it contains epsilon', 'When it has many production rules', 'When it uses both terminals and non-terminals'],
        'Ambiguity means a single string can be assigned more than one parse structure.',
        'ambiguity',
      ),
    () =>
      buildQuestion(
        'Which description best matches a sentential form?',
        'Any intermediate string of terminals and non-terminals during derivation',
        ['Only the final terminal string', 'Only the start symbol', 'Only strings that contain epsilon'],
        'A sentential form is any stage of the derivation before or at the final sentence.',
        'sentential-form',
      ),
    () =>
      buildQuestion(
        'What does a production rule in a CFG tell you?',
        'How a non-terminal may be rewritten',
        ['How a terminal can be split into more terminals', 'How to read the leaves of the parse tree', 'How many parse trees a string must have'],
        'Production rules specify the allowed replacements for non-terminals.',
        'production-rule',
      ),
    () =>
      buildQuestion(
        'Which node type appears only at the leaves of a completed parse tree?',
        'Terminal nodes',
        ['Start-symbol nodes', 'Production-rule nodes', 'Only ambiguous nodes'],
        'Once the derivation is complete, terminals appear as leaves because they do not expand further.',
        'leaf-type',
      ),
  ];

  return shuffle(factories).slice(0, 5).map((factory, index) => {
    const question = factory();
    return { ...question, id: `${question.id}-${index}-${Math.random().toString(36).slice(2, 6)}` };
  });
}

export default function QuizPage() {
  const [questions, setQuestions] = useState<QuizQuestion[]>(() => buildQuestionSet());
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});

  const score = useMemo(
    () =>
      questions.reduce((total, question) => {
        if (!submitted[question.id]) {
          return total;
        }
        return total + (selected[question.id] === question.answer ? 1 : 0);
      }, 0),
    [selected, submitted],
  );

  const completedCount = Object.keys(submitted).length;

  function resetQuiz() {
    setSelected({});
    setSubmitted({});
  }

  function generateNewSet() {
    setQuestions(buildQuestionSet());
    setSelected({});
    setSubmitted({});
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div className="rounded-[28px] border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,255,243,0.94))] p-7 shadow-[0_30px_70px_-46px_rgba(84,134,135,0.95)]">
        <p className="text-xs uppercase tracking-[0.24em] text-primary/80">Quiz Mode</p>
        <h2 className="mt-2 text-2xl font-medium text-foreground">Practice your CFG intuition</h2>
        <p className="mt-2 text-[15px] leading-7 text-muted-foreground">
          Answer short theory questions, reveal feedback instantly, and generate fresh question sets whenever you want a new round of practice.
        </p>

        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,255,199,0.42))] p-4 shadow-[0_18px_40px_-34px_rgba(84,134,135,0.82)] md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <HelpCircle className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-primary">Progress</p>
              <p className="text-[15px] text-muted-foreground">
                {completedCount} of {questions.length} answered
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[0_14px_28px_-22px_rgba(84,134,135,0.85)]">
              Score: {score} / {questions.length}
            </div>
            <button
              onClick={resetQuiz}
              className="flex items-center gap-2 rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-secondary hover:text-foreground"
            >
              <RefreshCcw className="h-4 w-4" />
              Reset
            </button>
            <button
              onClick={generateNewSet}
              className="flex items-center gap-2 rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-secondary hover:text-foreground"
            >
              <RefreshCcw className="h-4 w-4" />
              New Set
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {questions.map((question, index) => {
          const isSubmitted = Boolean(submitted[question.id]);
          const chosen = selected[question.id];
          const isCorrect = chosen === question.answer;

          return (
            <section
              key={question.id}
              className="rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,247,240,0.94))] p-6 shadow-[0_24px_54px_-40px_rgba(84,134,135,0.9)]"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-primary/80">Question {index + 1}</p>
                  <h3 className="mt-2 text-lg font-medium text-foreground">{question.prompt}</h3>
                </div>
                {isSubmitted ? (
                  isCorrect ? (
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  ) : (
                    <XCircle className="h-6 w-6 text-destructive" />
                  )
                ) : null}
              </div>

              <div className="grid gap-3">
                {question.options.map((option, optionIndex) => {
                  const isChosen = chosen === optionIndex;
                  const revealCorrect = isSubmitted && optionIndex === question.answer;
                  const revealWrong = isSubmitted && isChosen && optionIndex !== question.answer;

                  return (
                    <button
                      key={option}
                      onClick={() =>
                        !isSubmitted &&
                        setSelected(current => ({
                          ...current,
                          [question.id]: optionIndex,
                        }))
                      }
                      className={`rounded-2xl border px-4 py-3 text-left text-[15px] transition-all duration-300 ${
                        revealCorrect
                          ? 'border-primary bg-primary text-primary-foreground'
                          : revealWrong
                            ? 'border-destructive bg-destructive/10 text-foreground'
                            : isChosen
                              ? 'border-primary/40 bg-secondary/70 text-foreground'
                              : 'border-border bg-white/85 text-foreground hover:border-primary/30 hover:bg-secondary/45'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() =>
                    chosen !== undefined &&
                    setSubmitted(current => ({
                      ...current,
                      [question.id]: true,
                    }))
                  }
                  disabled={chosen === undefined || isSubmitted}
                  className="btn-generate"
                >
                  Check Answer
                </button>
                {isSubmitted ? (
                  <p className={`text-[15px] ${isCorrect ? 'text-primary' : 'text-destructive'}`}>
                    {isCorrect ? 'Correct.' : 'Not quite.'}
                  </p>
                ) : null}
              </div>

              {isSubmitted ? (
                <div className="mt-4 rounded-xl border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,255,199,0.42))] p-4 text-[15px] leading-7 text-muted-foreground">
                  <span className="font-medium text-primary">Explanation:</span> {question.explanation}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </motion.div>
  );
}
