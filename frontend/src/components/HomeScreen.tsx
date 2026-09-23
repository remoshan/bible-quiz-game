"use client";

import { useEffect, useState } from "react";
import { ArrowRightIcon, IlluminatedInitial, OrnamentIcon } from "@/components/icons";
import { useAuthStore } from "@/store/useAuthStore";
import { useGameStore, type Difficulty } from "@/store/useGameStore";

const NUMERALS = ["I", "II", "III", "IV", "V"];

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function HomeScreen({
  onOpenLeaderboard,
  onOpenSignIn,
}: {
  onOpenLeaderboard: () => void;
  onOpenSignIn: () => void;
}) {
  const status = useGameStore((s) => s.status);
  const error = useGameStore((s) => s.error);
  const start = useGameStore((s) => s.start);
  const difficulties = useGameStore((s) => s.difficulties);
  const loadDifficulties = useGameStore((s) => s.loadDifficulties);

  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);

  const [choice, setChoice] = useState<Difficulty | null>(null);

  useEffect(() => {
    void loadDifficulties();
  }, [loadDifficulties]);

  const isLoading = status === "loading";
  const active = choice ?? difficulties[1]?.key ?? difficulties[0]?.key ?? null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-8 pt-5 lg:max-w-4xl lg:px-12">
      <header className="rise shrink-0">
        <h1 className="font-serif text-2xl font-semibold leading-none tracking-tight lg:text-3xl">
          Verse
        </h1>
        <p className="label mt-2">The Daily Word Quiz</p>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row lg:items-center lg:gap-16">
        <section className="flex flex-1 flex-col justify-center py-8 lg:py-12">
          <p
            className="rise max-w-sm text-base leading-relaxed text-muted"
            style={{ animationDelay: "60ms" }}
          >
            Test your knowledge of Scripture in daily rounds of increasing challenge.
          </p>

          <p className="rise label mt-10" style={{ animationDelay: "120ms" }}>
            Choose your round
          </p>

          <ul className="rise mt-3" style={{ animationDelay: "160ms" }}>
            {difficulties.map((setting, position) => {
              const isActive = setting.key === active;

              return (
                <li key={setting.key} className="rule-t last:rule-b">
                  <button
                    type="button"
                    onClick={() => setChoice(setting.key)}
                    aria-pressed={isActive}
                    className="flex w-full items-baseline gap-5 py-4 pl-3 pr-1 text-left transition-colors"
                    style={
                      isActive
                        ? {
                            background: "var(--accent-tint)",
                            boxShadow: "inset 2px 0 0 0 var(--accent)",
                          }
                        : undefined
                    }
                  >
                    <span
                      className="w-7 shrink-0 font-serif text-lg"
                      style={{ color: isActive ? "var(--accent)" : "var(--faint)" }}
                    >
                      {NUMERALS[position]}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block font-serif text-2xl font-semibold leading-none">
                        {setting.label}
                      </span>
                      <span className="mt-1.5 block text-xs text-faint">
                        {setting.questions} questions &middot; {setting.seconds} seconds each
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="rise mt-10 flex flex-col gap-3" style={{ animationDelay: "220ms" }}>
            <button
              type="button"
              disabled={isLoading || !active}
              onClick={() => active && start(active)}
              className="flex items-center justify-between gap-2 bg-accent px-6 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-accent-foreground transition-opacity disabled:opacity-50"
            >
              {isLoading ? "Gathering verses" : "Play now"}
              {isLoading ? null : <ArrowRightIcon className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="border border-rule px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:border-[var(--rule-strong)]"
            >
              Leaderboard
            </button>
          </div>

          <div className="rise mt-8 flex flex-col gap-3" style={{ animationDelay: "280ms" }}>
            {session ? (
              <p className="flex items-center gap-2.5 text-xs text-muted">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-rule text-2xs font-semibold">
                  {initialsOf(session.user.displayName)}
                </span>
                <span>
                  Signed in as{" "}
                  <span className="font-medium text-foreground">{session.user.displayName}</span>
                </span>
                <button
                  type="button"
                  onClick={signOut}
                  className="ml-auto underline underline-offset-4 hover:text-foreground"
                >
                  Sign out
                </button>
              </p>
            ) : (
              <button
                type="button"
                onClick={onOpenSignIn}
                className="text-left text-xs text-muted underline decoration-[var(--rule-strong)] underline-offset-4 hover:text-foreground"
              >
                Sign in to save your scores
              </button>
            )}

            {error ? (
              <p className="border border-rule px-4 py-3 text-xs text-wrong">{error}</p>
            ) : null}
          </div>
        </section>

        <aside
          className="rise hidden lg:flex lg:w-80 lg:shrink-0 lg:flex-col lg:items-start lg:justify-center"
          style={{ animationDelay: "40ms" }}
        >
          <IlluminatedInitial className="h-24 w-24 text-gold" />
          <p className="mt-8 max-w-xs font-serif text-xl leading-snug text-muted">
            Three rounds, drawn from the whole of Scripture. One question at a time, and a clock
            that does not wait.
          </p>
          <OrnamentIcon className="mt-8 h-4 w-32 text-faint" />
        </aside>
      </div>

      <footer className="rule-t shrink-0 pt-4 text-2xs text-faint">
        Scripture quoted from the New International Version
      </footer>
    </main>
  );
}
