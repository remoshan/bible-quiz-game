import express from "express";
import cors from "cors";
import { fetchQuestions } from "./db.ts";
import {
  DIFFICULTIES,
  createSession,
  isChoice,
  isDifficulty,
  isIndex,
  settingFor,
  submitAnswer,
} from "./game.ts";

const port = Number(process.env.PORT ?? 4000);
const origin = process.env.CORS_ORIGIN ?? "http://localhost:3000";

const app = express();

app.use(cors({ origin }));
app.use(express.json({ limit: "8kb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
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

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ error: "Something went wrong on the server." });
});

app.listen(port, () => {
  console.log(`Verse backend listening on http://localhost:${port}`);
});
