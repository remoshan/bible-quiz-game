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
    <main className="mx-auto flex h-dvh w-full max-w-md flex-col px-6 pb-6 pt-5 sm:max-w-2xl">
      <div className="flex shrink-0 items-center">
        <button
          type="button"
          onClick={reset}
          className="-ml-1 flex h-8 w-8 items-center justify-center text-faint transition-colors hover:text-foreground"
          aria-label="Quit game"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 h-px w-full shrink-0 bg-[var(--rule)]">
        <motion.div
          className="h-px w-full origin-left bg-accent"
          style={{ scaleX: timeLeft }}
        />
      </div>

      <div className="mt-2.5 flex shrink-0 items-baseline justify-between">
        <span className="label">
          Question {index + 1} of {totalQuestions}
        </span>
        <span className="font-serif text-lg font-semibold tabular-nums">{score}</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28, transition: { duration: 0.16, ease: "easeIn" } }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <span className="label" style={{ color: "var(--gold)" }}>
              {TYPE_LABELS[question.type] ?? question.type}
            </span>

            <p className="dropcap mt-4 text-balance font-serif text-2xl leading-snug sm:text-3xl">
              {question.verse_text}
            </p>

            <p className="mt-5 text-sm text-muted">{question.prompt}</p>

            {reference ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 font-serif text-sm font-semibold text-accent"
              >
                {reference} &middot; {question.translation}
              </motion.p>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <ul className="shrink-0 sm:grid sm:grid-cols-2 sm:gap-x-6">
        {question.options.map((option, i) => {
          const isCorrect = i === correctIndex;
          const isPicked = i === selected;

          const revealStyle = isRevealed
            ? isCorrect
              ? {
                  background: "var(--correct-tint)",
                  boxShadow: "inset 2px 0 0 0 var(--correct)",
                  color: "var(--correct)",
                }
              : isPicked
                ? {
                    background: "var(--wrong-tint)",
                    boxShadow: "inset 2px 0 0 0 var(--wrong)",
                    color: "var(--wrong)",
                  }
                : { opacity: 0.4 }
            : undefined;

          return (
            <li key={option} className="rule-t last:rule-b sm:last:border-b-0 sm:[&:nth-child(3)]:rule-t">
              <button
                type="button"
                disabled={isRevealed}
                onClick={() => void answer(i)}
                className="w-full py-3.5 pl-3 pr-1 text-left text-base transition-colors active:bg-[var(--tint)]"
                style={revealStyle}
              >
                {option}
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
