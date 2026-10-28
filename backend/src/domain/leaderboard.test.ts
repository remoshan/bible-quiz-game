import assert from "node:assert/strict";
import { test } from "node:test";
import { presentLeaderboard } from "./leaderboard.ts";

const rows = [
  { id: "s1", userId: "u1", displayName: "Ann", score: 900 },
  { id: "s2", userId: "u2", displayName: "Ben", score: 800 },
];

test("player ids never leave the server, and the viewer's own row is marked", () => {
  const { entries, you } = presentLeaderboard(rows, { userId: "u2", displayName: "Ben", rank: 2 });

  assert.deepEqual(entries, [
    { id: "s1", displayName: "Ann", score: 900, isYou: false },
    { id: "s2", displayName: "Ben", score: 800, isYou: true },
  ]);
  assert.equal(you, null);
});

test("a viewer outside the list gets their own standing, without their id", () => {
  const { entries, you } = presentLeaderboard(rows, { userId: "u9", displayName: "Zed", rank: 40 });

  assert.ok(entries.every((entry) => !entry.isYou));
  assert.deepEqual(you, { displayName: "Zed", rank: 40 });
});

test("an anonymous viewer gets the list and no standing", () => {
  const { entries, you } = presentLeaderboard(rows, null);

  assert.ok(entries.every((entry) => !entry.isYou && !("userId" in entry)));
  assert.equal(you, null);
});
