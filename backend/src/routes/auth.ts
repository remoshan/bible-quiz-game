import { Router } from "express";
import {
  isDisplayName,
  isDisplayNameTaken,
  isEmail,
  isPassword,
  refreshSession,
  signIn,
  signUp,
} from "../infrastructure/accounts.ts";
import { requireUser } from "./session.ts";

export const authRoutes = Router();

authRoutes.post("/signup", async (req, res) => {
  const { email, password, displayName } = req.body ?? {};

  if (!isEmail(email)) {
    res.status(400).json({ error: "Enter a valid email address." });
    return;
  }

  if (!isPassword(password)) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }

  if (!isDisplayName(displayName)) {
    res.status(400).json({ error: "Choose a display name of 1-32 characters." });
    return;
  }

  if (await isDisplayNameTaken(displayName)) {
    res.status(409).json({ error: "That display name is taken. Try another." });
    return;
  }

  const result = await signUp(email, password, displayName);

  if (!result.ok) {
    res.status(400).json({ error: result.message });
    return;
  }

  res.status(201).json({
    session: result.session,
    requiresConfirmation: result.requiresConfirmation,
  });
});

authRoutes.post("/signin", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!isEmail(email) || typeof password !== "string" || password.length === 0) {
    res.status(400).json({ error: "Enter your email and password." });
    return;
  }

  const result = await signIn(email, password);

  if (!result.ok) {
    res.status(401).json({ error: result.message });
    return;
  }

  res.json({ session: result.session });
});

authRoutes.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body ?? {};

  if (typeof refreshToken !== "string" || refreshToken.length === 0) {
    res.status(400).json({ error: "Missing refresh token." });
    return;
  }

  const result = await refreshSession(refreshToken);

  if (!result.ok) {
    res.status(401).json({ error: result.message });
    return;
  }

  res.json({ session: result.session });
});

authRoutes.get("/me", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  res.json({ user });
});
