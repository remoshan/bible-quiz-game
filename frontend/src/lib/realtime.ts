import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const LEADERBOARD_TOPIC = "leaderboard";
const SCORE_EVENT = "score";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

function realtimeClient() {
  if (!url || !anonKey) return null;

  client ??= createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}

export function onScoreSaved(handler: (difficulty: string) => void) {
  const supabase = realtimeClient();

  if (!supabase) return () => {};

  const channel = supabase
    .channel(LEADERBOARD_TOPIC)
    .on("broadcast", { event: SCORE_EVENT }, ({ payload }) => {
      const difficulty = (payload as { difficulty?: unknown })?.difficulty;
      if (typeof difficulty === "string") handler(difficulty);
    })
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
