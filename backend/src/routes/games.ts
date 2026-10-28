import { Router, type Response } from "express";
import { answerQuestion, saveGameScore, startGame } from "../application/games.ts";
import { isChoice, isDifficulty, isIndex } from "../domain/game.ts";
import { startLimit } from "./limits.ts";
import { fail, requireUser } from "./session.ts";

export const gameRoutes = Router();

const REASONS = {
  not_found: "This round has expired. Start a new one.",
  already_finished: "This round is already over.",
  out_of_sync: "That question has already been answered.",
  not_finished: "Finish the round before saving your score.",
  already_saved: "This score is already saved.",
};

const reject = (res: Response, code: keyof typeof REASONS) =>
  fail(res, code === "not_found" ? 404 : 409, REASONS[code], code);

gameRoutes.post("/", startLimit, async (req, res) => {
  const { difficulty } = req.body ?? {};

  if (!isDifficulty(difficulty)) return fail(res, 400, "difficulty must be one of easy, medium, hard");

  const result = await startGame(difficulty);

  if (!result.ok) return fail(res, 503, `No ${difficulty} questions are available yet.`);

  res.status(201).json(result.game);
});

gameRoutes.post("/:gameId/answers", (req, res) => {
  const { index, choice } = req.body ?? {};

  if (!isIndex(index)) return fail(res, 400, "index must be a non-negative integer");
  if (!isChoice(choice)) return fail(res, 400, "choice must be an integer 0-3 or null");

  const outcome = answerQuestion(req.params.gameId, index, choice);

  if (!outcome.ok) return reject(res, outcome.reason);

  res.json(outcome);
});

gameRoutes.post("/:gameId/save", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const result = await saveGameScore(req.params.gameId, user);

  if (!result.ok) return reject(res, result.reason);

  res.status(201).json({ saved: true, rank: result.rank, summary: result.summary });
});
