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
