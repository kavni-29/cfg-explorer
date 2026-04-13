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

const questions: QuizQuestion[] = [
  {
    id: 'q1',
    prompt: 'Which symbol in a CFG must appear as the root of every parse tree?',
    options: ['Any terminal', 'The start symbol', 'The leftmost non-terminal', 'The first production'],
    answer: 1,
    explanation: 'Every derivation begins from the start symbol, so the parse tree root must be that symbol.',
  },
  {
    id: 'q2',
    prompt: 'In a leftmost derivation, which non-terminal is expanded at each step?',
    options: ['The deepest one', 'The rightmost one', 'The leftmost one', 'The start symbol only'],
    answer: 2,
    explanation: 'Leftmost derivation means the first non-terminal from the left is always expanded next.',
  },
  {
    id: 'q3',
    prompt: 'What is the yield of a parse tree?',
    options: ['All internal nodes from top to bottom', 'The production rules used', 'The leaf terminals read left to right', 'The set of non-terminals in the tree'],
    answer: 2,
    explanation: 'The yield is formed by reading the terminal leaves from left to right.',
  },
  {
    id: 'q4',
    prompt: 'A grammar is ambiguous when:',
    options: ['It has more than four rules', 'A string has two different parse trees', 'It contains epsilon', 'It has both terminals and non-terminals'],
    answer: 1,
    explanation: 'Ambiguity means at least one string can be parsed in more than one structurally distinct way.',
  },
  {
    id: 'q5',
    prompt: 'Which of the following is a sentential form?',
    options: ['Only the final terminal string', 'Any intermediate string during derivation', 'Only the start symbol', 'Only a string with epsilon'],
    answer: 1,
    explanation: 'A sentential form is any string of terminals and non-terminals that appears during derivation.',
  },
];

export default function QuizPage() {
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
          Answer short theory questions, reveal feedback instantly, and use the explanations to tighten up the concepts before exams or assignments.
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
