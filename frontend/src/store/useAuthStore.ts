import { create } from "zustand";
import { persist } from "zustand/middleware";
import { request } from "@/lib/api";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
};

export type Session = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
};

type AuthState = {
  session: Session | null;
  busy: boolean;
  error: string | null;
  notice: string | null;
  signUp: (email: string, password: string, displayName: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => void;
  accessToken: () => Promise<string | null>;
  clearMessages: () => void;
};

const REFRESH_MARGIN_MS = 60_000;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      busy: false,
      error: null,
      notice: null,

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
    }),
    {
      name: "verse-session",
      partialize: (state) => ({ session: state.session }),
    }
  )
);
