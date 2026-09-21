import { createClient } from "@supabase/supabase-js";
import type { StoredQuestion } from "./game.ts";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env");
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function fetchQuestions(difficulty: string, count: number): Promise<StoredQuestion[]> {
  const { data, error } = await supabase.rpc("get_quiz", {
    p_difficulty: difficulty,
    p_count: count,
  });

  if (error) throw new Error(`Question lookup failed: ${error.message}`);

  return (data ?? []) as StoredQuestion[];
}

export type ScoreRow = {
  user_id: string;
  difficulty: string;
  score: number;
  correct_answers: number;
  total_questions: number;
  duration_ms: number;
};

export type LeaderboardEntry = {
  id: string;
  userId: string;
  displayName: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  durationMs: number;
  createdAt: string;
};

export type PlayerStanding = {
  rank: number;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  durationMs: number;
  createdAt: string;
};

export async function saveScore(row: ScoreRow) {
  const { error } = await supabase.from("leaderboard").insert(row);

  if (error) throw new Error(`Score save failed: ${error.message}`);
}

export async function fetchLeaderboard(difficulty: string, limit: number) {
  const { data, error } = await supabase.rpc("get_leaderboard", {
    p_difficulty: difficulty,
    p_limit: limit,
  });

  if (error) throw new Error(`Leaderboard lookup failed: ${error.message}`);

  return (data ?? []).map(
    (row: Record<string, string & number>): LeaderboardEntry => ({
      id: row.id,
      userId: row.user_id,
      displayName: row.display_name,
      score: row.score,
      correctAnswers: row.correct_answers,
      totalQuestions: row.total_questions,
      durationMs: row.duration_ms,
      createdAt: row.created_at,
    })
  );
}

export async function fetchPlayerStanding(difficulty: string, userId: string) {
  const { data, error } = await supabase.rpc("get_player_standing", {
    p_difficulty: difficulty,
    p_user_id: userId,
  });

  if (error) throw new Error(`Standing lookup failed: ${error.message}`);

  const row = (data ?? [])[0];
  if (!row) return null;

  return {
    rank: Number(row.rank),
    score: row.score,
    correctAnswers: row.correct_answers,
    totalQuestions: row.total_questions,
    durationMs: row.duration_ms,
    createdAt: row.created_at,
  } satisfies PlayerStanding;
}

export async function isDisplayNameTaken(displayName: string) {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .ilike("display_name", displayName.trim())
    .limit(1);

  if (error) throw new Error(`Display name lookup failed: ${error.message}`);

  return (data ?? []).length > 0;
}
