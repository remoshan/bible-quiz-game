"use client";

import { useEffect } from "react";
import { AnimatePresence, animate, motion, useMotionValue } from "framer-motion";
import { CloseIcon } from "@/components/icons";
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
    deadline,
    score,
    selected,
    correctIndex,
    reference,
    answer,
    reset,
  } = useGameStore();

  const isRevealed = correctIndex !== null;
  const timeLeft = useMotionValue(1);

  useEffect(() => {
    if (isRevealed) return;

    timeLeft.set(1);
    const countdown = animate(timeLeft, 0, {
      duration: Math.max(0, (deadline - Date.now()) / 1000),
      ease: "linear",
    });

    return () => countdown.stop();
  }, [index, isRevealed, deadline, timeLeft]);

  if (!question) return null;

  return (
    <main className="mx-auto flex h-dvh w-full max-w-md flex-col px-5 pb-6 pt-4 sm:max-w-2xl">
      <header className="flex shrink-0 items-center justify-between gap-4">
        <button
          type="button"
          onClick={reset}
          className="glass flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground"
          aria-label="Quit game"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        <span className="text-2xs font-medium uppercase tracking-[0.18em] text-faint">
          Question {index + 1} of {totalQuestions}
        </span>

        <span className="glass rounded-full px-3 py-1.5 text-xs font-semibold tabular-nums">
          {score}
        </span>
      </header>

      <div className="mt-4 h-1 w-full shrink-0 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <motion.div
          className="h-full w-full origin-left rounded-full bg-accent"
          style={{ scaleX: timeLeft }}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden py-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 36 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -36, transition: { duration: 0.16, ease: "easeIn" } }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="glass rounded-3xl px-6 py-7 sm:px-8 sm:py-9"
          >
            <span className="text-2xs font-semibold uppercase tracking-[0.2em] text-gold">
              {TYPE_LABELS[question.type] ?? question.type}
            </span>

            <p className="mt-3 text-balance font-serif text-xl font-medium leading-snug sm:text-2xl">
              {question.verse_text}
            </p>

            <p className="mt-4 text-sm text-muted">{question.prompt}</p>

            {reference ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-sm font-semibold text-accent"
              >
                {reference} &middot; {question.translation}
              </motion.p>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="grid shrink-0 grid-cols-1 gap-2.5 sm:grid-cols-2">
        {question.options.map((option, i) => {
          const isCorrect = i === correctIndex;
          const isPicked = i === selected;

          const revealStyle = isRevealed
            ? isCorrect
              ? { background: "var(--correct-surface)", borderColor: "var(--correct)" }
              : isPicked
                ? { background: "var(--wrong-surface)", borderColor: "var(--wrong)" }
                : { opacity: 0.4 }
            : undefined;

          return (
            <motion.button
              key={option}
              type="button"
              disabled={isRevealed}
              whileTap={{ scale: 0.985 }}
              animate={{ scale: isRevealed && (isCorrect || isPicked) ? 1.02 : 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 16 }}
              onClick={() => void answer(i)}
              className="hairline rounded-2xl bg-transparent px-5 py-3.5 text-left text-base font-medium transition-colors"
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
