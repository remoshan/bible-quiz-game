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
  rename: (displayName: string) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
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
    (set, get) => {
      const act = async (fallback: string, work: () => Promise<Partial<AuthState>>) => {
        set({ busy: true, error: null, notice: null });

        try {
          set({ busy: false, ...(await work()) });
          return true;
        } catch (error) {
          set({ busy: false, error: error instanceof Error ? error.message : fallback });
          return false;
        }
      };

      const token = async () => {
        const value = await get().accessToken();
        if (!value) throw new Error("Your session has expired. Please sign in again.");
        return value;
      };

      return {
        session: null,
        busy: false,
        error: null,
        notice: null,
        recovery: null,

        signUp: async (email, password, displayName) =>
          (await act("Could not create your account.", async () => {
            const body = await request("/api/auth/signup", {
              method: "POST",
              body: { email, password, displayName },
            });

            return body.requiresConfirmation
              ? { notice: "Check your inbox to confirm your email, then sign in." }
              : { session: body.session };
          })) && get().session !== null,

        signIn: (email, password) =>
          act("Could not sign you in.", async () => {
            const body = await request("/api/auth/signin", { method: "POST", body: { email, password } });
            return { session: body.session };
          }),

        signOut: () => set({ session: null, error: null, notice: null }),

        accessToken: async () => {
          const { session } = get();
          if (!session) return null;

          if (session.expiresAt - REFRESH_MARGIN_MS > Date.now()) return session.accessToken;

          try {
            const body = await request("/api/auth/refresh", {
              method: "POST",
              body: { refreshToken: session.refreshToken },
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

        requestReset: (email) =>
          act("Could not send the reset link.", async () => {
            await request("/api/auth/forgot", { method: "POST", body: { email } });
            return { notice: "If an account exists for that email, a reset link is on its way." };
          }),

        resetPassword: async (password) => {
          const accessToken = get().recovery?.token;
          if (!accessToken) return false;

          return act("Could not update your password.", async () => {
            await request("/api/auth/reset", { method: "POST", body: { accessToken, password } });
            return { recovery: null, notice: "Password updated. Sign in with your new password." };
          });
        },

        endRecovery: () => set({ recovery: null, error: null }),

        rename: (displayName) =>
          act("Could not change your display name.", async () => {
            const body = await request("/api/auth/profile", {
              method: "PATCH",
              body: { displayName },
              token: await token(),
            });

            const { session } = get();
            return { notice: "Display name updated.", session: session && { ...session, user: body.user } };
          }),

        deleteAccount: () =>
          act("Could not delete your account.", async () => {
            await request("/api/auth/account", { method: "DELETE", token: await token() });
            return { session: null };
          }),
      };
    },
    {
      name: "verse-session",
      partialize: (state) => ({ session: state.session }),
    }
  )
);
