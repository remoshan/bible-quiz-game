import type { Request, Response } from "express";
import { userFromToken, type AuthUser } from "../infrastructure/accounts.ts";

export function fail(res: Response, status: number, error: string, code?: string) {
  res.status(status).json({ error, code });
}

function bearerToken(req: Request) {
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice(7).trim() : null;
}

export async function optionalUser(req: Request): Promise<AuthUser | null> {
  const token = bearerToken(req);
  return token ? await userFromToken(token) : null;
}

export async function requireUser(req: Request, res: Response): Promise<AuthUser | null> {
  const token = bearerToken(req);
  const user = token ? await userFromToken(token) : null;

  if (!user) {
    fail(res, 401, token ? "Your session has expired. Please sign in again." : "Sign in to continue.");
  }

  return user;
}
