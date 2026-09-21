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
  difficulty: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  durationMs: number;
  createdAt: string;
  displayName: string;
};

export async function saveScore(row: ScoreRow) {
  const { error } = await supabase.from("leaderboard").insert(row);

  if (error) throw new Error(`Score save failed: ${error.message}`);
}

export async function rankFor(difficulty: string, score: number) {
  const { count, error } = await supabase
    .from("leaderboard")
    .select("id", { count: "exact", head: true })
    .eq("difficulty", difficulty)
    .gt("score", score);

  if (error) throw new Error(`Rank lookup failed: ${error.message}`);

  return (count ?? 0) + 1;
}

export async function fetchLeaderboard(difficulty: string | null, limit: number) {
  let query = supabase
    .from("leaderboard")
    .select("id, difficulty, score, correct_answers, total_questions, duration_ms, created_at, users(display_name)")
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);

  if (difficulty) query = query.eq("difficulty", difficulty);

  const { data, error } = await query;

  if (error) throw new Error(`Leaderboard lookup failed: ${error.message}`);

  return (data ?? []).map((row): LeaderboardEntry => {
    const profile = row.users as unknown as { display_name?: string } | null;

    return {
      id: row.id,
      difficulty: row.difficulty,
      score: row.score,
      correctAnswers: row.correct_answers,
      totalQuestions: row.total_questions,
      durationMs: row.duration_ms,
      createdAt: row.created_at,
      displayName: profile?.display_name ?? "Player",
    };
  });
}
