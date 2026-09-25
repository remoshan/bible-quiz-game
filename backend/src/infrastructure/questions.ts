import type { StoredQuestion } from "../domain/game.ts";
import { supabase } from "./supabase.ts";

export async function fetchQuestions(difficulty: string, count: number): Promise<StoredQuestion[]> {
  const { data, error } = await supabase.rpc("get_quiz", {
    p_difficulty: difficulty,
    p_count: count,
  });

  if (error) throw new Error(`Question lookup failed: ${error.message}`);

  return (data ?? []) as StoredQuestion[];
}
