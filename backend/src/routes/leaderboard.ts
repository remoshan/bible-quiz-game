import { Router } from "express";
import { pageSize, viewLeaderboard } from "../application/leaderboard.ts";
import { isDifficulty } from "../domain/game.ts";
import { optionalUser } from "./session.ts";

export const leaderboardRoutes = Router();

leaderboardRoutes.get("/", async (req, res) => {
  const { difficulty, limit } = req.query;

  if (!isDifficulty(difficulty)) {
    res.status(400).json({ error: "difficulty must be one of easy, medium, hard" });
    return;
  }

  const viewer = await optionalUser(req);

  res.json(await viewLeaderboard(difficulty, pageSize(limit), viewer));
});
