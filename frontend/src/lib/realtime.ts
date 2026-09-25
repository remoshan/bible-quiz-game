import { RealtimeClient } from "@supabase/realtime-js";

const TOPIC = "leaderboard";
const EVENT = "score";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const apikey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: RealtimeClient | null = null;

export function onScoreSaved(handler: (difficulty: string) => void) {
  if (!url || !apikey) return () => {};

  client ??= new RealtimeClient(`${url}/realtime/v1`, { params: { apikey } });

  const channel = client
    .channel(TOPIC)
    .on("broadcast", { event: EVENT }, ({ payload }: { payload: { difficulty?: unknown } }) => {
      if (typeof payload?.difficulty === "string") handler(payload.difficulty);
    })
    .subscribe();

  return () => {
    void channel.unsubscribe();
  };
}
