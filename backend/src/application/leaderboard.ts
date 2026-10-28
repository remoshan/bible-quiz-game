import { presentLeaderboard } from "../domain/leaderboard.ts";
import type { AuthUser } from "../infrastructure/accounts.ts";
import { fetchLeaderboard, fetchPlayerStanding } from "../infrastructure/scores.ts";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function pageSize(value: unknown) {
  const parsed = Number(value ?? DEFAULT_LIMIT);
  return Number.isInteger(parsed) ? Math.min(Math.max(parsed, 1), MAX_LIMIT) : DEFAULT_LIMIT;
}

async function standingOf(difficulty: string, viewer: Promise<AuthUser | null>) {
  const user = await viewer;
  if (!user) return null;

  const standing = await fetchPlayerStanding(difficulty, user.id);
  return standing && { userId: user.id, displayName: user.displayName, ...standing };
}

export async function viewLeaderboard(
  difficulty: string,
  limit: number,
  viewer: Promise<AuthUser | null>
) {
  const [rows, mine] = await Promise.all([
    fetchLeaderboard(difficulty, limit),
    standingOf(difficulty, viewer),
  ]);

  return presentLeaderboard(rows, mine);
}
