import { Router } from "express";
import { pageSize, viewLeaderboard } from "../application/leaderboard.ts";
import { isDifficulty } from "../domain/game.ts";
import { fail, optionalUser } from "./session.ts";

export const leaderboardRoutes = Router();

leaderboardRoutes.get("/", async (req, res) => {
  const { difficulty, limit } = req.query;

  if (!isDifficulty(difficulty)) return fail(res, 400, "difficulty must be one of easy, medium, hard");

  res.json(await viewLeaderboard(difficulty, pageSize(limit), optionalUser(req)));
});
