import { create } from "zustand";
import { request } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { type Difficulty } from "@/store/useGameStore";

export type Entry = {
  id: string;
  userId: string;
  displayName: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  durationMs: number;
  createdAt: string;
};

export type Standing = Omit<Entry, "id"> & { rank: number };

type LeaderboardState = {
  difficulty: Difficulty;
  entries: Entry[] | null;
  you: Standing | null;
  error: string | null;
  live: boolean;
  highlighted: string[];
  setDifficulty: (difficulty: Difficulty) => void;
  load: (live: boolean) => Promise<void>;
};

const PAGE_SIZE = 20;
const HIGHLIGHT_MS = 2200;

let latestRequest = 0;
let knownIds = new Set<string>();

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  difficulty: "easy",
  entries: null,
  you: null,
  error: null,
  live: false,
  highlighted: [],

  setDifficulty: (difficulty) => {
    knownIds = new Set();
    set({ difficulty, entries: null, you: null, error: null, live: false, highlighted: [] });
  },

  load: async (live) => {
    const ticket = (latestRequest += 1);
    const { difficulty } = get();
    const token = useAuthStore.getState().session
      ? await useAuthStore.getState().accessToken()
      : null;

    try {
      const body = await request(
        `/api/leaderboard?difficulty=${difficulty}&limit=${PAGE_SIZE}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );

      if (ticket !== latestRequest || get().difficulty !== difficulty) return;

      const entries: Entry[] = body.entries;
      const arrived = entries.filter((entry) => !knownIds.has(entry.id));
      knownIds = new Set(entries.map((entry) => entry.id));

      set({ entries, you: body.you, error: null, live });

      if (live && arrived.length > 0) {
        const ids = arrived.map((entry) => entry.id);
        set({ highlighted: ids });

        setTimeout(() => {
          const remaining = get().highlighted.filter((id) => !ids.includes(id));
          set({ highlighted: remaining });
        }, HIGHLIGHT_MS);
      }
    } catch {
      if (ticket !== latestRequest) return;

      set({
        entries: [],
        you: null,
        error: "Could not load the leaderboard.",
        live: false,
        highlighted: [],
      });
    }
  },
}));
