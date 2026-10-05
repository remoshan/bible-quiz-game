import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { request } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useGameStore } from "@/store/useGameStore";

vi.mock("@/lib/api", () => ({ request: vi.fn() }));

const mockRequest = vi.mocked(request);

const question = {
  id: "q1",
  type: "guess_the_book",
  prompt: "Which book of the Bible is this verse from?",
  verse_text: "In the beginning, God created heaven and earth.",
  translation: "CPDV",
  options: ["Genesis", "Exodus", "Job", "Psalms"],
};

const summary = {
  score: 100,
  correctAnswers: 1,
  totalQuestions: 1,
  durationMs: 1000,
  difficulty: "easy" as const,
};

let games = 0;

function newGame(overrides: object = {}) {
  games += 1;
  return {
    gameId: `game-${games}`,
    totalQuestions: 2,
    revealMs: 1000,
    index: 0,
    question,
    deadline: Date.now() + 20_000,
    serverNow: Date.now(),
    ...overrides,
  };
}

function deferred() {
  let resolve!: (value: unknown) => void;
  const promise = new Promise<unknown>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const callsTo = (suffix: string) =>
  mockRequest.mock.calls.filter(([path]) => path.endsWith(suffix)).length;

async function startGame(game = newGame()) {
  mockRequest.mockResolvedValueOnce(game);
  await useGameStore.getState().start("easy");
}

beforeEach(() => {
  vi.useFakeTimers();
  mockRequest.mockReset();
  useGameStore.getState().reset();
  useGameStore.setState({ difficulties: [] });
});

afterEach(() => {
  vi.useRealTimers();
});

test("a double tap while the answer is in flight sends one request", async () => {
  await startGame();
  const pending = deferred();
  mockRequest.mockReturnValueOnce(pending.promise);

  const first = useGameStore.getState().answer(0);
  const second = useGameStore.getState().answer(0);

  pending.resolve({
    correctIndex: 0,
    reference: "Genesis 1:1",
    score: 100,
    status: "playing",
    next: { index: 1, question, deadline: Date.now() + 21_000, serverNow: Date.now() },
    summary: null,
  });
  await Promise.all([first, second]);

  expect(callsTo("/answers")).toBe(1);
  expect(useGameStore.getState().status).toBe("playing");
  expect(useGameStore.getState().error).toBeNull();
});

test("quitting while the final answer is in flight stays on the home screen", async () => {
  await startGame();
  const pending = deferred();
  mockRequest.mockReturnValueOnce(pending.promise);

  const answering = useGameStore.getState().answer(0);
  useGameStore.getState().reset();

  pending.resolve({
    correctIndex: 0,
    reference: "Genesis 1:1",
    score: 100,
    status: "finished",
    next: null,
    summary,
  });
  await answering;
  await vi.runAllTimersAsync();

  expect(useGameStore.getState().status).toBe("idle");
  expect(useGameStore.getState().summary).toBeNull();
});

test("the deadline is re-based onto the local clock when the server clock differs", async () => {
  const serverNow = Date.now() + 5_000;
  await startGame(newGame({ serverNow, deadline: serverNow + 20_000 }));

  expect(useGameStore.getState().deadline).toBe(Date.now() + 20_000);
});

test("a response without serverNow keeps its deadline and does not auto-submit", async () => {
  const deadline = Date.now() + 20_000;
  await startGame(newGame({ serverNow: undefined, deadline }));

  expect(useGameStore.getState().deadline).toBe(deadline);

  await vi.advanceTimersByTimeAsync(1_000);
  expect(callsTo("/answers")).toBe(0);
});

test("two save calls at once post the score once", async () => {
  useAuthStore.setState({ accessToken: async () => "token" });
  useGameStore.setState({ gameId: "game-save", status: "game_over", summary });
  mockRequest.mockResolvedValue({ saved: true, rank: 1 });

  await Promise.all([useGameStore.getState().saveScore(), useGameStore.getState().saveScore()]);

  expect(callsTo("/save")).toBe(1);
  expect(useGameStore.getState().saveState).toBe("saved");
});

test("a failed difficulty load retries and clears the error", async () => {
  mockRequest
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce({
      difficulties: [{ key: "easy", label: "Easy", questions: 10, seconds: 20 }],
    });

  await useGameStore.getState().loadDifficulties();
  expect(useGameStore.getState().error).not.toBeNull();

  await vi.advanceTimersByTimeAsync(5_000);

  expect(useGameStore.getState().difficulties).toHaveLength(1);
  expect(useGameStore.getState().error).toBeNull();
});
