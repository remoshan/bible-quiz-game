import { create } from "zustand";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type Difficulty = "easy" | "medium" | "hard";

export type DifficultySetting = {
  key: Difficulty;
  label: string;
  questions: number;
  seconds: number;
};

export type Question = {
  id: string;
  type: string;
  prompt: string;
  verse_text: string;
  translation: string;
  options: string[];
};

export type Summary = {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  durationMs: number;
  difficulty: Difficulty;
};

export type GameStatus = "idle" | "loading" | "playing" | "game_over";

type GameState = {
  status: GameStatus;
  error: string | null;
  difficulties: DifficultySetting[];
  gameId: string | null;
  difficulty: Difficulty | null;
  totalQuestions: number;
  secondsPerQuestion: number;
  revealMs: number;
  index: number;
  question: Question | null;
  deadline: number;
  score: number;
  correctAnswers: number;
  selected: number | null;
  correctIndex: number | null;
  reference: string | null;
  summary: Summary | null;
  loadDifficulties: () => Promise<void>;
  start: (difficulty: Difficulty) => Promise<void>;
  answer: (choice: number | null) => Promise<void>;
  reset: () => void;
};

const initialGame = {
  gameId: null,
  difficulty: null,
  totalQuestions: 0,
  secondsPerQuestion: 0,
  revealMs: 1000,
  index: 0,
  question: null,
  deadline: 0,
  score: 0,
  correctAnswers: 0,
  selected: null,
  correctIndex: null,
  reference: null,
  summary: null,
};

let deadlineTimer: ReturnType<typeof setTimeout> | undefined;
let revealTimer: ReturnType<typeof setTimeout> | undefined;

const clearTimers = () => {
  if (deadlineTimer) clearTimeout(deadlineTimer);
  if (revealTimer) clearTimeout(revealTimer);
  deadlineTimer = undefined;
  revealTimer = undefined;
};

async function request(path: string, init?: RequestInit) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.error ?? `Request failed with status ${response.status}`);
  }

  return body;
}

export const useGameStore = create<GameState>((set, get) => {
  const armDeadline = (deadline: number) => {
    if (deadlineTimer) clearTimeout(deadlineTimer);
    deadlineTimer = setTimeout(() => void get().answer(null), Math.max(0, deadline - Date.now()));
  };

  return {
    status: "idle",
    error: null,
    difficulties: [],
    ...initialGame,

    loadDifficulties: async () => {
      if (get().difficulties.length > 0) return;

      try {
        const body = await request("/api/difficulties");
        set({ difficulties: body.difficulties });
      } catch {
        set({ error: "Cannot reach the game server. Is the backend running?" });
      }
    },

    start: async (difficulty) => {
      clearTimers();
      set({ ...initialGame, status: "loading", difficulty, error: null });

      try {
        const game = await request("/api/games", {
          method: "POST",
          body: JSON.stringify({ difficulty }),
        });

        if (get().status !== "loading" || get().difficulty !== difficulty) return;

        set({
          status: "playing",
          gameId: game.gameId,
          totalQuestions: game.totalQuestions,
          secondsPerQuestion: game.secondsPerQuestion,
          revealMs: game.revealMs,
          index: game.index,
          question: game.question,
          deadline: game.deadline,
        });

        armDeadline(game.deadline);
      } catch (error) {
        set({
          ...initialGame,
          status: "idle",
          error: error instanceof Error ? error.message : "Could not start the game.",
        });
      }
    },

    answer: async (choice) => {
      const { status, correctIndex, gameId, index } = get();
      if (status !== "playing" || correctIndex !== null || !gameId) return;

      clearTimers();
      set({ selected: choice });

      try {
        const outcome = await request(`/api/games/${gameId}/answers`, {
          method: "POST",
          body: JSON.stringify({ index, choice }),
        });

        set({
          correctIndex: outcome.correctIndex,
          reference: outcome.reference,
          score: outcome.score,
          correctAnswers: outcome.correctAnswers,
        });

        revealTimer = setTimeout(() => {
          if (outcome.status === "finished") {
            set({ status: "game_over", summary: outcome.summary, correctIndex: null });
            return;
          }

          set({
            index: outcome.next.index,
            question: outcome.next.question,
            deadline: outcome.next.deadline,
            selected: null,
            correctIndex: null,
            reference: null,
          });

          armDeadline(outcome.next.deadline);
        }, get().revealMs);
      } catch (error) {
        clearTimers();
        set({
          ...initialGame,
          status: "idle",
          error: error instanceof Error ? error.message : "Lost contact with the game server.",
        });
      }
    },

    reset: () => {
      clearTimers();
      set({ ...initialGame, status: "idle", error: null });
    },
  };
});
