"use client";

import { useEffect, useState, type ComponentType } from "react";
import { AuthPanel } from "@/components/AuthPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowRightIcon, SaplingIcon, SeedIcon, ShieldIcon, TreeIcon } from "@/components/icons";
import { useAuthStore } from "@/store/useAuthStore";
import { useGameStore, type Difficulty } from "@/store/useGameStore";

const DIFFICULTY_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  easy: SeedIcon,
  medium: SaplingIcon,
  hard: TreeIcon,
};

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function HomeScreen({ onOpenLeaderboard }: { onOpenLeaderboard: () => void }) {
  const status = useGameStore((s) => s.status);
  const error = useGameStore((s) => s.error);
  const start = useGameStore((s) => s.start);
  const difficulties = useGameStore((s) => s.difficulties);
  const loadDifficulties = useGameStore((s) => s.loadDifficulties);

  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);

  const [choice, setChoice] = useState<Difficulty | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    void loadDifficulties();
  }, [loadDifficulties]);

  const isLoading = status === "loading";
  const active = choice ?? difficulties[1]?.key ?? difficulties[0]?.key ?? null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-6 pt-4 lg:max-w-5xl lg:px-10">
      <header className="flex shrink-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-serif text-lg font-semibold leading-none tracking-tight">Verse</p>
          <p className="mt-1 text-2xs font-medium uppercase tracking-[0.18em] text-faint">
            The Daily Word Quiz
          </p>
        </div>

        <ShieldIcon className="h-7 w-7 shrink-0 text-gold" />

        <div className="flex shrink-0 items-center gap-2">
          {session ? (
            <span
              title={session.user.displayName}
              className="glass flex h-9 w-9 items-center justify-center rounded-full text-2xs font-semibold tracking-wide"
            >
              {initialsOf(session.user.displayName)}
            </span>
          ) : null}
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row lg:items-center lg:gap-14">
        <section className="flex flex-1 flex-col justify-center py-6 lg:py-0">
          <div className="rise glass rounded-3xl p-3 lg:p-4" style={{ animationDelay: "60ms" }}>
            <div className="flex flex-col gap-2">
              {difficulties.map((setting) => {
                const Icon = DIFFICULTY_ICONS[setting.key] ?? SeedIcon;
                const isActive = setting.key === active;

                return (
                  <button
                    key={setting.key}
                    type="button"
                    onClick={() => setChoice(setting.key)}
                    aria-pressed={isActive}
                    className={
                      isActive
                        ? "glass-raised flex translate-x-1.5 items-center gap-4 rounded-2xl px-4 py-3.5 text-left transition-transform duration-300 ease-out active:scale-[0.99]"
                        : "hairline flex items-center gap-4 rounded-2xl bg-transparent px-4 py-3.5 text-left transition-transform duration-300 ease-out active:scale-[0.99]"
                    }
                    style={
                      isActive
                        ? {
                            borderColor: "var(--accent)",
                            boxShadow: "var(--shadow-raised), 0 0 0 4px var(--accent-ring)",
                          }
                        : undefined
                    }
                  >
                    <Icon
                      className={
                        isActive ? "h-7 w-7 shrink-0 text-accent" : "h-7 w-7 shrink-0 text-faint"
                      }
                    />

                    <span className="min-w-0 flex-1">
                      <span className="block font-serif text-lg font-semibold leading-tight">
                        {setting.label}
                      </span>
                      <span className="block text-xs text-muted">
                        {setting.questions} questions &middot; {setting.seconds}s each
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <p
            className="rise mt-5 text-center text-sm text-muted lg:text-left"
            style={{ animationDelay: "130ms" }}
          >
            Test your knowledge of Scripture in daily rounds of increasing challenge.
          </p>

          <div className="rise mt-5 flex flex-col gap-2.5" style={{ animationDelay: "200ms" }}>
            <button
              type="button"
              disabled={isLoading || !active}
              onClick={() => active && start(active)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-sm font-semibold uppercase tracking-[0.12em] text-accent-foreground transition-transform duration-200 active:scale-[0.99] disabled:opacity-60"
            >
              {isLoading ? "Gathering verses" : "Play now"}
              {isLoading ? null : <ArrowRightIcon className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="hairline rounded-2xl bg-transparent py-3.5 text-sm font-semibold uppercase tracking-[0.12em] text-foreground transition-colors"
            >
              Leaderboard
            </button>
          </div>

          <div className="rise mt-4 flex flex-col gap-2.5" style={{ animationDelay: "270ms" }}>
            {session ? (
              <p className="text-center text-xs text-muted">
                Signed in as{" "}
                <span className="font-medium text-foreground">{session.user.displayName}</span>
                {" · "}
                <button type="button" onClick={signOut} className="underline underline-offset-4">
                  Sign out
                </button>
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setShowAuth((open) => !open)}
                className="text-center text-xs text-muted underline decoration-faint underline-offset-4"
              >
                {showAuth ? "Maybe later" : "Sign in to save your scores"}
              </button>
            )}

            {!session && showAuth ? <AuthPanel onSuccess={() => setShowAuth(false)} /> : null}

            {error ? (
              <p className="glass rounded-2xl px-4 py-3 text-center text-xs text-wrong">{error}</p>
            ) : null}
          </div>
        </section>

        <aside
          className="rise hidden lg:flex lg:w-[22rem] lg:shrink-0 lg:flex-col lg:justify-center"
          style={{ animationDelay: "40ms" }}
        >
          <ShieldIcon className="h-12 w-12 text-gold" />
          <h1 className="mt-6 font-serif text-5xl font-semibold leading-none tracking-tight">
            Verse
          </h1>
          <p className="mt-3 text-2xs font-medium uppercase tracking-[0.22em] text-faint">
            The Daily Word Quiz
          </p>
          <p className="mt-6 max-w-xs text-base leading-relaxed text-muted">
            Three rounds. Ninety seconds of thinking. One question at a time, drawn from the whole
            of Scripture.
          </p>
        </aside>
      </div>

      <footer className="shrink-0 pt-2 text-center text-2xs text-faint lg:text-left">
        Scripture quoted from the New International Version
      </footer>
    </main>
  );
}
