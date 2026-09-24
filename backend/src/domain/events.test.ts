import assert from "node:assert/strict";
import { test } from "node:test";
import { publish, subscribe, subscriberCount, type DomainEvents } from "./events.ts";

const summary: DomainEvents["game.completed"]["summary"] = {
  score: 420,
  correctAnswers: 4,
  totalQuestions: 5,
  durationMs: 9000,
  difficulty: "easy",
};

test("a subscriber receives the published payload", () => {
  const seen: DomainEvents["game.completed"][] = [];
  const stop = subscribe("game.completed", (payload) => seen.push(payload));

  publish("game.completed", { gameId: "g1", summary });

  assert.equal(seen.length, 1);
  assert.equal(seen[0].gameId, "g1");
  assert.equal(seen[0].summary.score, 420);

  stop();
});

test("unsubscribing stops delivery", () => {
  let calls = 0;
  const stop = subscribe("game.completed", () => {
    calls += 1;
  });

  publish("game.completed", { gameId: "g1", summary });
  stop();
  publish("game.completed", { gameId: "g2", summary });

  assert.equal(calls, 1);
  assert.equal(subscriberCount("game.completed"), 0);
});

test("a failing subscriber cannot break publish or the subscribers after it", () => {
  const seen: string[] = [];

  const stopFirst = subscribe("game.completed", () => {
    throw new Error("subscriber exploded");
  });
  const stopSecond = subscribe("game.completed", (payload) => seen.push(payload.gameId));

  assert.doesNotThrow(() => publish("game.completed", { gameId: "g3", summary }));
  assert.deepEqual(seen, ["g3"]);

  stopFirst();
  stopSecond();
});

test("publishing with no subscribers is a no-op", () => {
  assert.equal(subscriberCount("score.saved"), 0);
  assert.doesNotThrow(() =>
    publish("score.saved", {
      gameId: "g4",
      userId: "u1",
      displayName: "Player",
      summary,
      rank: 1,
    })
  );
});
