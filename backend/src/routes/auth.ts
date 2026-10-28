import { Router } from "express";
import {
  deleteUser,
  isDisplayName,
  isDisplayNameTaken,
  isEmail,
  isPassword,
  refreshSession,
  renameUser,
  sendPasswordReset,
  setPassword,
  signIn,
  signUp,
  userFromToken,
} from "../infrastructure/accounts.ts";
import { resetLimit, signInLimit, signUpLimit } from "./limits.ts";
import { requireUser } from "./session.ts";

export const authRoutes = Router();

const NAME_TAKEN = { status: 409, error: "That display name is taken. Try another." };

async function displayNameProblem(displayName: unknown, ownerId?: string) {
  if (!isDisplayName(displayName)) {
    return { status: 400, error: "Choose a display name of 1-32 characters." };
  }

  return (await isDisplayNameTaken(displayName, ownerId)) ? NAME_TAKEN : null;
}

authRoutes.post("/signup", signUpLimit, async (req, res) => {
  const { email, password, displayName } = req.body ?? {};

  if (!isEmail(email)) {
    res.status(400).json({ error: "Enter a valid email address." });
    return;
  }

  if (!isPassword(password)) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }

  const problem = await displayNameProblem(displayName);

  if (problem) {
    res.status(problem.status).json({ error: problem.error });
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

authRoutes.post("/signin", signInLimit, async (req, res) => {
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

authRoutes.post("/forgot", resetLimit, async (req, res) => {
  const { email } = req.body ?? {};

  if (!isEmail(email)) {
    res.status(400).json({ error: "Enter a valid email address." });
    return;
  }

  await sendPasswordReset(email);

  res.json({ sent: true });
});

authRoutes.post("/reset", async (req, res) => {
  const { accessToken, password } = req.body ?? {};

  if (!isPassword(password)) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }

  const user = typeof accessToken === "string" && accessToken ? await userFromToken(accessToken) : null;

  if (!user) {
    res.status(401).json({ error: "This reset link has expired. Request a new one." });
    return;
  }

  const error = await setPassword(user.id, password);

  if (error) {
    res.status(400).json({ error });
    return;
  }

  res.json({ reset: true });
});

authRoutes.patch("/profile", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const { displayName } = req.body ?? {};

  const problem =
    (await displayNameProblem(displayName, user.id)) ??
    ((await renameUser(user.id, displayName)) ? null : NAME_TAKEN);

  if (problem) {
    res.status(problem.status).json({ error: problem.error });
    return;
  }

  res.json({ user: { ...user, displayName: displayName.trim() } });
});

authRoutes.delete("/account", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  await deleteUser(user.id);

  res.json({ deleted: true });
});
