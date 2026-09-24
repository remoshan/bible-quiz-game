import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env");
}

const authClient = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_DISPLAY_NAME_LENGTH = 32;

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
};

export type AuthResult =
  | { ok: true; session: AuthSession | null; requiresConfirmation: boolean }
  | { ok: false; message: string };

export function isEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && EMAIL_PATTERN.test(value);
}

export function isPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= MIN_PASSWORD_LENGTH && value.length <= 72;
}

export function isDisplayName(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= MAX_DISPLAY_NAME_LENGTH
  );
}

type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
};

type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: { display_name?: string };
};

function toSession(session: SupabaseSession, user: SupabaseUser): AuthSession {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: (session.expires_at ?? 0) * 1000,
    user: {
      id: user.id,
      email: user.email ?? "",
      displayName: user.user_metadata?.display_name ?? "Player",
    },
  };
}

export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<AuthResult> {
  const { data, error } = await authClient.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName.trim() } },
  });

  if (error) return { ok: false, message: error.message };
  if (!data.session || !data.user) return { ok: true, session: null, requiresConfirmation: true };

  return { ok: true, session: toSession(data.session, data.user), requiresConfirmation: false };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await authClient.auth.signInWithPassword({ email, password });

  if (error || !data.session || !data.user) {
    return { ok: false, message: "That email and password combination is not recognised." };
  }

  return { ok: true, session: toSession(data.session, data.user), requiresConfirmation: false };
}

export async function refreshSession(refreshToken: string): Promise<AuthResult> {
  const { data, error } = await authClient.auth.refreshSession({ refresh_token: refreshToken });

  if (error || !data.session || !data.user) {
    return { ok: false, message: "Your session has expired. Please sign in again." };
  }

  return { ok: true, session: toSession(data.session, data.user), requiresConfirmation: false };
}

export async function userFromToken(accessToken: string): Promise<AuthUser | null> {
  const { data, error } = await authClient.auth.getUser(accessToken);

  if (error || !data.user) return null;

  return {
    id: data.user.id,
    email: data.user.email ?? "",
    displayName: data.user.user_metadata?.display_name ?? "Player",
  };
}
