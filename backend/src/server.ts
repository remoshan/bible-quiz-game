import express from "express";
import cors from "cors";
import { registerSubscribers } from "./application/subscribers.ts";
import { DIFFICULTIES } from "./domain/game.ts";
import { authRoutes } from "./routes/auth.ts";
import { gameRoutes } from "./routes/games.ts";
import { leaderboardRoutes } from "./routes/leaderboard.ts";

const port = Number(process.env.PORT ?? 4000);
const origin = process.env.CORS_ORIGIN ?? "http://localhost:3000";

registerSubscribers();

const app = express();

app.use(cors({ origin }));
app.use(express.json({ limit: "8kb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/difficulties", (_req, res) => {
  res.json({ difficulties: DIFFICULTIES });
});

app.use("/api/auth", authRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ error: "Something went wrong on the server." });
});

app.listen(port, () => {
  console.log(`Verse backend listening on http://localhost:${port}`);
});
