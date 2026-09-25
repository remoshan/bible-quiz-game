import type { Request, Response } from "express";
import { userFromToken, type AuthUser } from "../infrastructure/accounts.ts";

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

  if (!token) {
    res.status(401).json({ error: "Sign in to continue." });
    return null;
  }

  const user = await userFromToken(token);

  if (!user) {
    res.status(401).json({ error: "Your session has expired. Please sign in again." });
    return null;
  }

  return user;
}
