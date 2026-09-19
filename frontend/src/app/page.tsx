"use client";

import { DIFFICULTY_SETTINGS, useGameStore } from "@/store/useGameStore";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  const state = useGameStore();
  const question = state.questions[state.index];

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 p-6 text-sm">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Verse</h1>
        <ThemeToggle />
      </div>

      <div className="glass rounded-2xl p-4">
        <p data-testid="status">
          status: <strong>{state.status}</strong> · score: <strong>{state.score}</strong> · correct:{" "}
          <strong>{state.correctAnswers}</strong> · q{" "}
          <strong>
            {state.questions.length ? state.index + 1 : 0}/{state.questions.length}
          </strong>
        </p>
        {state.error ? <p className="mt-2 text-wrong">{state.error}</p> : null}
      </div>

      {state.status === "idle" || state.status === "loading" ? (
        <div className="flex gap-2">
          {(Object.keys(DIFFICULTY_SETTINGS) as Array<keyof typeof DIFFICULTY_SETTINGS>).map((d) => (
            <button
              key={d}
              onClick={() => state.start(d)}
              className="glass flex-1 rounded-2xl p-3 font-medium"
            >
              {DIFFICULTY_SETTINGS[d].label}
            </button>
          ))}
        </div>
      ) : null}

      {question ? (
        <div className="glass rounded-2xl p-4">
          <p className="text-muted">{question.prompt}</p>
          <p className="mt-2">{question.verse_text}</p>
          <p className="mt-1 text-muted">
            {question.reference} · {question.translation} · {question.type}
          </p>
        </div>
      ) : null}

      {question && state.status === "playing" ? (
        <div className="grid grid-cols-1 gap-2">
          {question.options.map((option, i) => (
            <button
              key={option}
              data-testid={`option-${i}`}
              onClick={() => state.answer(i)}
              className="glass rounded-2xl p-3 text-left"
              style={{
                borderColor: state.isRevealed
                  ? i === question.correct_index
                    ? "var(--correct)"
                    : i === state.selected
                      ? "var(--wrong)"
                      : undefined
                  : undefined,
              }}
            >
              {i}. {option}
            </button>
          ))}
        </div>
      ) : null}

      {state.status === "game_over" ? (
        <div className="glass rounded-2xl p-4">
          <p>
            Final score <strong>{state.score}</strong> · {state.correctAnswers}/
            {state.questions.length} correct · {Math.round(state.durationMs / 1000)}s
          </p>
          <button onClick={state.reset} className="glass mt-3 rounded-2xl p-3">
            Reset
          </button>
        </div>
      ) : null}
    </main>
  );
}
