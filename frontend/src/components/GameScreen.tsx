"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/store/useGameStore";

const TYPE_LABELS: Record<string, string> = {
  guess_the_book: "Guess the Book",
  fill_in_the_blank: "Fill in the Blank",
  who_said_it: "Who Said It",
};

export function GameScreen() {
  const {
    question,
    index,
    totalQuestions,
    secondsPerQuestion,
    score,
    selected,
    correctIndex,
    reference,
    answer,
    reset,
  } = useGameStore();

  if (!question) return null;

  const isRevealed = correctIndex !== null;

  return (
    <main className="mx-auto flex h-dvh w-full max-w-md flex-col px-5 pb-6 pt-5">
      <header className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={reset}
          className="glass flex h-9 w-9 items-center justify-center rounded-full text-sm"
          aria-label="Quit game"
        >
          ✕
        </button>

        <span className="text-xs font-medium tracking-wide text-muted">
          {index + 1} of {totalQuestions}
        </span>

        <span className="glass rounded-full px-3 py-1.5 text-xs font-semibold tabular-nums">
          {score}
        </span>
      </header>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div
          key={index}
          className="h-full w-full origin-left rounded-full bg-accent"
          style={{
            animation: `timer-shrink ${secondsPerQuestion}s linear forwards`,
            animationPlayState: isRevealed ? "paused" : "running",
          }}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden py-5">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="glass rounded-3xl px-6 py-7"
        >
          <span className="text-[11px] font-semibold uppercase tracking-widest text-accent">
            {TYPE_LABELS[question.type] ?? question.type}
          </span>

          <p className="mt-3 text-balance text-xl font-medium leading-snug">
            {question.verse_text}
          </p>

          <p className="mt-4 text-[13px] text-muted">{question.prompt}</p>

          {reference ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-[13px] font-semibold text-accent"
            >
              {reference} · {question.translation}
            </motion.p>
          ) : null}
        </motion.div>
      </div>

      <div className="grid shrink-0 grid-cols-1 gap-2.5">
        {question.options.map((option, i) => {
          const isCorrect = i === correctIndex;
          const isPicked = i === selected;

          const revealStyle = isRevealed
            ? isCorrect
              ? { background: "var(--correct-surface)", boxShadow: "0 0 0 2px var(--correct)" }
              : isPicked
                ? { background: "var(--wrong-surface)", boxShadow: "0 0 0 2px var(--wrong)" }
                : { opacity: 0.45 }
            : undefined;

          return (
            <motion.button
              key={option}
              type="button"
              disabled={isRevealed}
              whileTap={{ scale: 0.98 }}
              animate={{ scale: isRevealed && (isCorrect || isPicked) ? 1.035 : 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 14 }}
              onClick={() => void answer(i)}
              className="glass rounded-2xl px-5 py-3.5 text-left text-[15px] font-medium transition-colors"
              style={revealStyle}
            >
              {option}
            </motion.button>
          );
        })}
      </div>
    </main>
  );
}
