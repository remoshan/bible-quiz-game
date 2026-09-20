import assert from "node:assert/strict";
import { mock, test } from "node:test";
import {
  REVEAL_MS,
  createSession,
  isChoice,
  isDifficulty,
  isIndex,
  submitAnswer,
  type StoredQuestion,
} from "./game.ts";

function makeQuestions(count: number): StoredQuestion[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `q${i}`,
    type: "guess_the_book",
    difficulty: "easy" as const,
    prompt: "Which book?",
    verse_text: `verse ${i}`,
    reference: `Book ${i}:1`,
    translation: "NIV",
    options: ["a", "b", "c", "d"],
    correct_index: 2,
  }));
}

test("input guards reject anything outside the contract", () => {
  assert.equal(isDifficulty("easy"), true);
  assert.equal(isDifficulty("impossible"), false);
  assert.equal(isChoice(0), true);
  assert.equal(isChoice(3), true);
  assert.equal(isChoice(null), true);
  assert.equal(isChoice(4), false);
  assert.equal(isChoice(-1), false);
  assert.equal(isChoice(1.5), false);
  assert.equal(isChoice("2"), false);
  assert.equal(isIndex(0), true);
  assert.equal(isIndex(-1), false);
  assert.equal(isIndex(1.5), false);
});

test("the question handed to the client carries no answer", () => {
  const game = createSession("easy", makeQuestions(3));
  assert.ok(!("correct_index" in game.question));
  assert.ok(!("reference" in game.question));
});

test("a correct answer scores the base plus remaining seconds", () => {
  mock.timers.enable({ apis: ["Date"] });

  const game = createSession("easy", makeQuestions(3));
  mock.timers.tick(5000);

  const outcome = submitAnswer(game.gameId, 0, 2);
  assert.equal(outcome.ok, true);
  assert.equal(outcome.correct, true);
  assert.equal(outcome.score, 100 + 15 * 10);
  assert.equal(outcome.correctAnswers, 1);
  assert.equal(outcome.reference, "Book 0:1");

  mock.timers.reset();
});

test("a wrong answer scores nothing but still advances", () => {
  const game = createSession("easy", makeQuestions(3));
  const outcome = submitAnswer(game.gameId, 0, 0);

  assert.equal(outcome.ok, true);
  assert.equal(outcome.correct, false);
  assert.equal(outcome.score, 0);
  assert.equal(outcome.correctAnswers, 0);
  assert.equal(outcome.correctIndex, 2);
  assert.equal(outcome.status, "playing");
  assert.equal(outcome.next?.index, 1);
});

test("the next deadline leaves room for the reveal animation", () => {
  mock.timers.enable({ apis: ["Date"] });

  const game = createSession("easy", makeQuestions(3));
  const outcome = submitAnswer(game.gameId, 0, 2);

  assert.equal(outcome.ok, true);
  assert.equal(outcome.next?.deadline, Date.now() + REVEAL_MS + 20_000);

  mock.timers.reset();
});

test("an answer arriving after the deadline scores nothing even if correct", () => {
  mock.timers.enable({ apis: ["Date"] });

  const game = createSession("easy", makeQuestions(3));
  mock.timers.tick(25_000);

  const outcome = submitAnswer(game.gameId, 0, 2);
  assert.equal(outcome.ok, true);
  assert.equal(outcome.timedOut, true);
  assert.equal(outcome.correct, false);
  assert.equal(outcome.score, 0);

  mock.timers.reset();
});

test("an answer inside the latency grace window still counts", () => {
  mock.timers.enable({ apis: ["Date"] });

  const game = createSession("easy", makeQuestions(3));
  mock.timers.tick(20_500);

  const outcome = submitAnswer(game.gameId, 0, 2);
  assert.equal(outcome.ok, true);
  assert.equal(outcome.timedOut, false);
  assert.equal(outcome.correct, true);
  assert.equal(outcome.score, 100);

  mock.timers.reset();
});

test("the same question cannot be answered twice", () => {
  const game = createSession("easy", makeQuestions(3));

  assert.equal(submitAnswer(game.gameId, 0, 2).ok, true);

  const replay = submitAnswer(game.gameId, 0, 2);
  assert.equal(replay.ok, false);
  assert.equal(replay.ok === false && replay.reason, "out_of_sync");
});

test("a client cannot answer ahead of the question it has been shown", () => {
  const game = createSession("easy", makeQuestions(3));

  const skipAhead = submitAnswer(game.gameId, 2, 2);
  assert.equal(skipAhead.ok, false);
  assert.equal(skipAhead.ok === false && skipAhead.reason, "out_of_sync");
});

test("an unknown game is rejected", () => {
  const outcome = submitAnswer("no-such-game", 0, 0);
  assert.equal(outcome.ok, false);
  assert.equal(outcome.ok === false && outcome.reason, "not_found");
});

test("the final answer finishes the game and returns a summary", () => {
  const game = createSession("easy", makeQuestions(2));

  submitAnswer(game.gameId, 0, 2);
  const last = submitAnswer(game.gameId, 1, 2);

  assert.equal(last.ok, true);
  assert.equal(last.status, "finished");
  assert.equal(last.next, null);
  assert.equal(last.summary?.correctAnswers, 2);
  assert.equal(last.summary?.totalQuestions, 2);
  assert.equal(last.summary?.difficulty, "easy");

  const afterEnd = submitAnswer(game.gameId, 1, 2);
  assert.equal(afterEnd.ok, false);
  assert.equal(afterEnd.ok === false && afterEnd.reason, "already_finished");
});
