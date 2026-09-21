import express from "express";
import cors from "cors";
import { fetchLeaderboard, fetchQuestions, rankFor, saveScore } from "./db.ts";
import {
  isDisplayName,
  isEmail,
  isPassword,
  refreshSession,
  signIn,
  signUp,
  userFromToken,
  type AuthUser,
} from "./auth.ts";
import {
  DIFFICULTIES,
  createSession,
  getSavableSession,
  isChoice,
  isDifficulty,
  isIndex,
  markSessionSaved,
  settingFor,
  submitAnswer,
} from "./game.ts";

const port = Number(process.env.PORT ?? 4000);
const origin = process.env.CORS_ORIGIN ?? "http://localhost:3000";

const app = express();

app.use(cors({ origin }));
app.use(express.json({ limit: "8kb" }));

async function requireUser(
  req: express.Request,
  res: express.Response
): Promise<AuthUser | null> {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : null;

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

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/signup", async (req, res) => {
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

  const result = await signUp(email, password, displayName);

  if (!result.ok) {
    res.status(400).json({ error: result.message });
    return;
  }

  res.status(201).json({ session: result.session, requiresConfirmation: result.requiresConfirmation });
});

app.post("/api/auth/signin", async (req, res) => {
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

app.post("/api/auth/refresh", async (req, res) => {
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

app.get("/api/auth/me", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  res.json({ user });
});

app.get("/api/difficulties", (_req, res) => {
  res.json({ difficulties: DIFFICULTIES });
});

app.post("/api/games", async (req, res) => {
  const { difficulty } = req.body ?? {};

  if (!isDifficulty(difficulty)) {
    res.status(400).json({ error: "difficulty must be one of easy, medium, hard" });
    return;
  }

  const questions = await fetchQuestions(difficulty, settingFor(difficulty).questions);

  if (questions.length === 0) {
    res.status(503).json({ error: `No ${difficulty} questions are available yet.` });
    return;
  }

  res.status(201).json(createSession(difficulty, questions));
});

app.post("/api/games/:gameId/answers", (req, res) => {
  const { index, choice } = req.body ?? {};

  if (!isIndex(index)) {
    res.status(400).json({ error: "index must be a non-negative integer" });
    return;
  }

  if (!isChoice(choice)) {
    res.status(400).json({ error: "choice must be an integer 0-3 or null" });
    return;
  }

  const outcome = submitAnswer(req.params.gameId, index, choice);

  if (!outcome.ok) {
    const status = outcome.reason === "not_found" ? 404 : 409;
    res.status(status).json({ error: outcome.reason });
    return;
  }

  res.json(outcome);
});

app.post("/api/games/:gameId/save", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const savable = getSavableSession(req.params.gameId);

  if (!savable.ok) {
    const status = savable.reason === "not_found" ? 404 : 409;
    res.status(status).json({ error: savable.reason });
    return;
  }

  const { summary } = savable;

  await saveScore({
    user_id: user.id,
    difficulty: summary.difficulty,
    score: summary.score,
    correct_answers: summary.correctAnswers,
    total_questions: summary.totalQuestions,
    duration_ms: summary.durationMs,
  });

  markSessionSaved(req.params.gameId);

  const rank = await rankFor(summary.difficulty, summary.score);

  res.status(201).json({ saved: true, rank, summary });
});

app.get("/api/leaderboard", async (req, res) => {
  const { difficulty, limit } = req.query;

  if (difficulty !== undefined && !isDifficulty(difficulty)) {
    res.status(400).json({ error: "difficulty must be one of easy, medium, hard" });
    return;
  }

  const parsed = Number(limit ?? 20);
  const size = Number.isInteger(parsed) ? Math.min(Math.max(parsed, 1), 100) : 20;

  const entries = await fetchLeaderboard(difficulty ?? null, size);

  res.json({ entries });
});

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ error: "Something went wrong on the server." });
});

app.listen(port, () => {
  console.log(`Verse backend listening on http://localhost:${port}`);
});
