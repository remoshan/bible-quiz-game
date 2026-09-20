import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export type Difficulty = "easy" | "medium" | "hard";

export type QuestionType = "guess_the_book" | "fill_in_the_blank" | "who_said_it";

export type Question = {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  prompt: string;
  verse_text: string;
  reference: string;
  translation: string;
  options: string[];
  correct_index: number;
};

export type GameStatus = "idle" | "loading" | "playing" | "game_over";

export const DIFFICULTY_SETTINGS: Record<
  Difficulty,
  { label: string; questions: number; seconds: number }
> = {
  easy: { label: "Easy", questions: 10, seconds: 20 },
  medium: { label: "Medium", questions: 15, seconds: 15 },
  hard: { label: "Hard", questions: 20, seconds: 15 },
};

export const REVEAL_MS = 1000;

const POINTS_PER_CORRECT = 100;
const POINTS_PER_SECOND_LEFT = 10;

type GameState = {
  status: GameStatus;
  difficulty: Difficulty | null;
  questions: Question[];
  index: number;
  score: number;
  correctAnswers: number;
  selected: number | null;
  isRevealed: boolean;
  questionEndsAt: number;
  startedAt: number;
  durationMs: number;
  error: string | null;
  start: (difficulty: Difficulty) => Promise<void>;
  answer: (choice: number | null) => void;
  next: () => void;
  reset: () => void;
};

const initialState = {
  status: "idle" as GameStatus,
  difficulty: null,
  questions: [] as Question[],
  index: 0,
  score: 0,
  correctAnswers: 0,
  selected: null,
  isRevealed: false,
  questionEndsAt: 0,
  startedAt: 0,
  durationMs: 0,
  error: null,
};

let timer: ReturnType<typeof setTimeout> | undefined;

const clearTimer = () => {
  if (timer) clearTimeout(timer);
  timer = undefined;
};

export const useGameStore = create<GameState>((set, get) => {
  const beginQuestion = () => {
    const { difficulty } = get();
    if (!difficulty) return;

    const { seconds } = DIFFICULTY_SETTINGS[difficulty];
    clearTimer();
    set({ selected: null, isRevealed: false, questionEndsAt: Date.now() + seconds * 1000 });
    timer = setTimeout(() => get().answer(null), seconds * 1000);
  };

  return {
    ...initialState,

    start: async (difficulty) => {
      clearTimer();
      set({ ...initialState, status: "loading", difficulty });

      const { questions: count } = DIFFICULTY_SETTINGS[difficulty];
      const { data, error } = await supabase.rpc("get_quiz", {
        p_difficulty: difficulty,
        p_count: count,
      });

      if (get().status !== "loading" || get().difficulty !== difficulty) return;

      const questions = (data ?? []) as Question[];

      if (error || questions.length === 0) {
        set({
          ...initialState,
          error: error?.message ?? `No ${difficulty} questions are available yet.`,
        });
        return;
      }

      set({ status: "playing", questions, startedAt: Date.now() });
      beginQuestion();
    },

    answer: (choice) => {
      const { status, isRevealed, questions, index, questionEndsAt, score, correctAnswers } = get();
      if (status !== "playing" || isRevealed) return;

      clearTimer();

      const isCorrect = choice !== null && choice === questions[index].correct_index;
      const secondsLeft = Math.max(0, Math.ceil((questionEndsAt - Date.now()) / 1000));

      set({
        selected: choice,
        isRevealed: true,
        score: isCorrect ? score + POINTS_PER_CORRECT + secondsLeft * POINTS_PER_SECOND_LEFT : score,
        correctAnswers: isCorrect ? correctAnswers + 1 : correctAnswers,
      });

      timer = setTimeout(() => get().next(), REVEAL_MS);
    },

    next: () => {
      clearTimer();
      const { status, index, questions, startedAt } = get();
      if (status !== "playing") return;

      if (index + 1 >= questions.length) {
        set({
          status: "game_over",
          durationMs: Date.now() - startedAt,
          selected: null,
          isRevealed: false,
        });
        return;
      }

      set({ index: index + 1 });
      beginQuestion();
    },

    reset: () => {
      clearTimer();
      set(initialState);
    },
  };
});
