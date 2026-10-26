"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export function AuthPanel({ onSuccess }: { onSuccess?: () => void }) {
  const { busy, error, notice, signIn, signUp, requestReset, clearMessages } = useAuthStore();

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const isSignUp = mode === "signup";
  const isForgot = mode === "forgot";

  const field =
    "border border-rule bg-transparent px-3.5 py-3 text-base outline-none placeholder:text-faint focus:border-accent";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isForgot) {
      await requestReset(email);
      return;
    }

    const ok = isSignUp
      ? await signUp(email, password, displayName)
      : await signIn(email, password);

    if (ok) onSuccess?.();
  };

  const go = (next: typeof mode) => {
    clearMessages();
    setMode(next);
  };

  return (
    <form onSubmit={submit} className="rise flex flex-col gap-2.5">
      {isSignUp ? (
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Display name"
          aria-label="Display name"
          autoComplete="nickname"
          maxLength={32}
          required
          className={field}
        />
      ) : null}

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        aria-label="Email"
        autoComplete="email"
        required
        className={field}
      />

      {isForgot ? null : (
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isSignUp ? "Password (8+ characters)" : "Password"}
          aria-label="Password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          required
          className={field}
        />
      )}

      <button
        type="submit"
        disabled={busy}
        className="bg-accent py-3 text-sm font-semibold uppercase tracking-[0.16em] text-accent-foreground transition-opacity disabled:opacity-60"
      >
        {busy ? "Working…" : isForgot ? "Send reset link" : isSignUp ? "Create account" : "Sign in"}
      </button>

      {error ? <p className="text-center text-xs text-wrong">{error}</p> : null}
      {notice ? <p className="text-center text-xs text-accent">{notice}</p> : null}

      {mode === "signin" ? (
        <button type="button" onClick={() => go("forgot")} className="py-1 text-center text-xs text-muted">
          Forgot password?
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => go(isSignUp || isForgot ? "signin" : "signup")}
        className="py-1 text-center text-xs text-muted"
      >
        {isForgot
          ? "Back to sign in"
          : isSignUp
            ? "Already have an account? Sign in"
            : "New here? Create an account"}
      </button>
    </form>
  );
}
