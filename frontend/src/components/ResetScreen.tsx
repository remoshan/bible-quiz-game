"use client";

import { useState } from "react";
import { BackIcon } from "@/components/icons";
import { useAuthStore } from "@/store/useAuthStore";

export function ResetScreen({ onDone }: { onDone: () => void }) {
  const { busy, error, recovery, resetPassword, endRecovery } = useAuthStore();
  const [password, setPassword] = useState("");

  const leave = () => {
    endRecovery();
    onDone();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (await resetPassword(password)) onDone();
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-8 pt-5 sm:max-w-lg">
      <header className="flex shrink-0 items-center">
        <button
          type="button"
          onClick={leave}
          className="-ml-1 flex h-8 w-8 items-center justify-center text-faint transition-colors hover:text-foreground"
          aria-label="Back"
        >
          <BackIcon className="h-4 w-4" />
        </button>
      </header>

      <div className="flex flex-1 flex-col justify-center py-8">
        <p className="label">Your account</p>

        {recovery?.token ? (
          <>
            <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight tracking-tight">
              Choose a new password
            </h1>

            <form onSubmit={submit} className="rise mt-8 flex flex-col gap-2.5">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password (8+ characters)"
                aria-label="New password"
                autoComplete="new-password"
                minLength={8}
                required
                className="border border-rule bg-transparent px-3.5 py-3 text-base outline-none placeholder:text-faint focus:border-accent"
              />

              <button
                type="submit"
                disabled={busy}
                className="bg-accent py-3 text-sm font-semibold uppercase tracking-[0.16em] text-accent-foreground transition-opacity disabled:opacity-60"
              >
                {busy ? "Working…" : "Set password"}
              </button>

              {error ? <p className="text-center text-xs text-wrong">{error}</p> : null}
            </form>
          </>
        ) : (
          <>
            <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight tracking-tight">
              This link has expired
            </h1>

            <p className="mt-4 max-w-sm text-base leading-relaxed text-muted">
              Email links work once and only for a short while. Request a new one from the
              sign-in screen.
            </p>

            <button
              type="button"
              onClick={leave}
              className="mt-8 bg-accent py-3 text-sm font-semibold uppercase tracking-[0.16em] text-accent-foreground"
            >
              Back to sign in
            </button>
          </>
        )}
      </div>
    </main>
  );
}
