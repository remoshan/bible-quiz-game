import { create } from "zustand";
import { persist } from "zustand/middleware";
import { request } from "@/lib/api";

type AuthUser = {
  id: string;
  displayName: string;
};

type Session = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
};

type Recovery = { token: string | null };

type AuthState = {
  session: Session | null;
  busy: boolean;
  error: string | null;
  notice: string | null;
  recovery: Recovery | null;
  signUp: (email: string, password: string, displayName: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => void;
  accessToken: () => Promise<string | null>;
  clearMessages: () => void;
  checkRecoveryLink: () => void;
  requestReset: (email: string) => Promise<boolean>;
  resetPassword: (password: string) => Promise<boolean>;
  endRecovery: () => void;
};

const REFRESH_MARGIN_MS = 60_000;

export function recoveryFromHash(hash: string): Recovery | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const token = params.get("access_token");

  if (params.get("type") === "recovery" && token) return { token };
  if (params.has("error_code")) return { token: null };

  return null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      busy: false,
      error: null,
      notice: null,
      recovery: null,

      signUp: async (email, password, displayName) => {
        set({ busy: true, error: null, notice: null });

        try {
          const body = await request("/api/auth/signup", {
            method: "POST",
            body: JSON.stringify({ email, password, displayName }),
          });

          if (body.requiresConfirmation) {
            set({
              busy: false,
              notice: "Check your inbox to confirm your email, then sign in.",
            });
            return false;
          }

          set({ session: body.session, busy: false });
          return true;
        } catch (error) {
          set({
            busy: false,
            error: error instanceof Error ? error.message : "Could not create your account.",
          });
          return false;
        }
      },

      signIn: async (email, password) => {
        set({ busy: true, error: null, notice: null });

        try {
          const body = await request("/api/auth/signin", {
            method: "POST",
            body: JSON.stringify({ email, password }),
          });

          set({ session: body.session, busy: false });
          return true;
        } catch (error) {
          set({
            busy: false,
            error: error instanceof Error ? error.message : "Could not sign you in.",
          });
          return false;
        }
      },

      signOut: () => set({ session: null, error: null, notice: null }),

      accessToken: async () => {
        const { session } = get();
        if (!session) return null;

        if (session.expiresAt - REFRESH_MARGIN_MS > Date.now()) return session.accessToken;

        try {
          const body = await request("/api/auth/refresh", {
            method: "POST",
            body: JSON.stringify({ refreshToken: session.refreshToken }),
          });

          set({ session: body.session });
          return body.session.accessToken as string;
        } catch {
          set({ session: null });
          return null;
        }
      },

      clearMessages: () => set({ error: null, notice: null }),

      checkRecoveryLink: () => {
        const recovery = recoveryFromHash(window.location.hash);
        if (!recovery) return;

        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        set({ recovery, error: null, notice: null });
      },

      requestReset: async (email) => {
        set({ busy: true, error: null, notice: null });

        try {
          await request("/api/auth/forgot", {
            method: "POST",
            body: JSON.stringify({ email }),
          });

          set({
            busy: false,
            notice: "If an account exists for that email, a reset link is on its way.",
          });
          return true;
        } catch (error) {
          set({
            busy: false,
            error: error instanceof Error ? error.message : "Could not send the reset link.",
          });
          return false;
        }
      },

      resetPassword: async (password) => {
        const token = get().recovery?.token;
        if (!token) return false;

        set({ busy: true, error: null, notice: null });

        try {
          await request("/api/auth/reset", {
            method: "POST",
            body: JSON.stringify({ accessToken: token, password }),
          });

          set({
            busy: false,
            recovery: null,
            notice: "Password updated. Sign in with your new password.",
          });
          return true;
        } catch (error) {
          set({
            busy: false,
            error: error instanceof Error ? error.message : "Could not update your password.",
          });
          return false;
        }
      },

      endRecovery: () => set({ recovery: null, error: null }),
    }),
    {
      name: "verse-session",
      partialize: (state) => ({ session: state.session }),
    }
  )
);
