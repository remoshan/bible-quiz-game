import { Router } from "express";
import { answerQuestion, saveGameScore, startGame } from "../application/games.ts";
import { isChoice, isDifficulty, isIndex } from "../domain/game.ts";
import { requireUser } from "./session.ts";

export const gameRoutes = Router();

gameRoutes.post("/", async (req, res) => {
  const { difficulty } = req.body ?? {};

  if (!isDifficulty(difficulty)) {
    res.status(400).json({ error: "difficulty must be one of easy, medium, hard" });
    return;
  }

  const result = await startGame(difficulty);

  if (!result.ok) {
    res.status(503).json({ error: `No ${difficulty} questions are available yet.` });
    return;
  }

  res.status(201).json(result.game);
});

gameRoutes.post("/:gameId/answers", (req, res) => {
  const { index, choice } = req.body ?? {};

  if (!isIndex(index)) {
    res.status(400).json({ error: "index must be a non-negative integer" });
    return;
  }

  if (!isChoice(choice)) {
    res.status(400).json({ error: "choice must be an integer 0-3 or null" });
    return;
  }

  const outcome = answerQuestion(req.params.gameId, index, choice);

  if (!outcome.ok) {
    res.status(outcome.reason === "not_found" ? 404 : 409).json({ error: outcome.reason });
    return;
  }

  res.json(outcome);
});

gameRoutes.post("/:gameId/save", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const result = await saveGameScore(req.params.gameId, user);

  if (!result.ok) {
    res.status(result.reason === "not_found" ? 404 : 409).json({ error: result.reason });
    return;
  }

  res.status(201).json({ saved: true, rank: result.rank, summary: result.summary });
});
