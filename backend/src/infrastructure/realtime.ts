export const LEADERBOARD_TOPIC = "leaderboard";
export const SCORE_EVENT = "score";

export async function announceScore(difficulty: string) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env");
  }

  const response = await fetch(
    `${url}/realtime/v1/api/broadcast/${LEADERBOARD_TOPIC}/events/${SCORE_EVENT}`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ difficulty }),
    }
  );

  if (!response.ok) {
    throw new Error(`Broadcast failed with status ${response.status}`);
  }
}
