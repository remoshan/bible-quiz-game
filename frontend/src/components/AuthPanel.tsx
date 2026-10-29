"use client";

import { useState } from "react";
import { Messages } from "@/components/AccountLayout";
import { useAuthStore } from "@/store/useAuthStore";

export function AuthPanel({ onSuccess }: { onSuccess?: () => void }) {
  const { busy, error, notice, signIn, signUp, requestReset, clearMessages } = useAuthStore();

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const isSignUp = mode === "signup";
  const isForgot = mode === "forgot";

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
          className="field"
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
        className="field"
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
          className="field"
        />
      )}

      <button type="submit" disabled={busy} className="button-primary">
        {busy ? "Working…" : isForgot ? "Send reset link" : isSignUp ? "Create account" : "Sign in"}
      </button>

      <Messages error={error} notice={notice} />

      {mode === "signin" ? (
        <button type="button" onClick={() => go("forgot")} className="button-link">
          Forgot password?
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => go(isSignUp || isForgot ? "signin" : "signup")}
        className="button-link"
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
