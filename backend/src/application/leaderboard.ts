import type { AuthUser } from "../infrastructure/accounts.ts";
import { fetchLeaderboard, fetchPlayerStanding } from "../infrastructure/scores.ts";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function pageSize(value: unknown) {
  const parsed = Number(value ?? DEFAULT_LIMIT);
  return Number.isInteger(parsed) ? Math.min(Math.max(parsed, 1), MAX_LIMIT) : DEFAULT_LIMIT;
}

export async function viewLeaderboard(
  difficulty: string,
  limit: number,
  viewer: AuthUser | null
) {
  const entries = await fetchLeaderboard(difficulty, limit);
  const standing = viewer ? await fetchPlayerStanding(difficulty, viewer.id) : null;

  return {
    entries,
    you:
      standing && viewer
        ? { ...standing, userId: viewer.id, displayName: viewer.displayName }
        : null,
  };
}
