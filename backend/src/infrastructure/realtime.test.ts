import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { LEADERBOARD_TOPIC, SCORE_EVENT, announceScore } from "./realtime.ts";

process.env.SUPABASE_URL = "https://project.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

type Call = { url: string; init: RequestInit };

function stubFetch(response: { ok: boolean; status: number }) {
  const calls: Call[] = [];

  mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return response as Response;
  });

  return calls;
}

test("a saved score is broadcast on the leaderboard topic", async () => {
  const calls = stubFetch({ ok: true, status: 202 });

  await announceScore("hard");

  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.endsWith(`/realtime/v1/api/broadcast/${LEADERBOARD_TOPIC}/events/${SCORE_EVENT}`));
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), { difficulty: "hard" });

  mock.restoreAll();
});

test("the broadcast payload carries nothing but the difficulty", async () => {
  const calls = stubFetch({ ok: true, status: 202 });

  await announceScore("easy");

  assert.deepEqual(Object.keys(JSON.parse(String(calls[0].init.body))), ["difficulty"]);

  mock.restoreAll();
});

test("a rejected broadcast surfaces as an error the caller can swallow", async () => {
  stubFetch({ ok: false, status: 500 });

  await assert.rejects(() => announceScore("easy"), /Broadcast failed with status 500/);

  mock.restoreAll();
});
