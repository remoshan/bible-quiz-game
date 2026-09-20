import { randomUUID } from "node:crypto";

export type Difficulty = "easy" | "medium" | "hard";

export type DifficultySetting = {
  key: Difficulty;
  label: string;
  questions: number;
  seconds: number;
};

export const DIFFICULTIES: DifficultySetting[] = [
  { key: "easy", label: "Easy", questions: 10, seconds: 20 },
  { key: "medium", label: "Medium", questions: 15, seconds: 15 },
  { key: "hard", label: "Hard", questions: 20, seconds: 15 },
];

export const REVEAL_MS = 1000;

const POINTS_PER_CORRECT = 100;
const POINTS_PER_SECOND_LEFT = 10;
const LATENCY_GRACE_MS = 1500;
const SESSION_TTL_MS = 60 * 60 * 1000;
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;

export type StoredQuestion = {
  id: string;
  type: string;
  difficulty: Difficulty;
  prompt: string;
  verse_text: string;
  reference: string;
  translation: string;
  options: string[];
  correct_index: number;
};

export type PublicQuestion = {
  id: string;
  type: string;
  prompt: string;
  verse_text: string;
  translation: string;
  options: string[];
};

type Session = {
  id: string;
  difficulty: Difficulty;
  questions: StoredQuestion[];
  index: number;
  score: number;
  correctAnswers: number;
  deadline: number;
  startedAt: number;
  finished: boolean;
};

const sessions = new Map<string, Session>();

const sweep = setInterval(() => {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [id, session] of sessions) {
    if (session.startedAt < cutoff) sessions.delete(id);
  }
}, SWEEP_INTERVAL_MS);

sweep.unref();

export function isDifficulty(value: unknown): value is Difficulty {
  return DIFFICULTIES.some((d) => d.key === value);
}

export function isChoice(value: unknown): value is number | null {
  return value === null || (Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 3);
}

export function isIndex(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

export function settingFor(difficulty: Difficulty): DifficultySetting {
  return DIFFICULTIES.find((d) => d.key === difficulty)!;
}

function toPublic(question: StoredQuestion): PublicQuestion {
  return {
    id: question.id,
    type: question.type,
    prompt: question.prompt,
    verse_text: question.verse_text,
    translation: question.translation,
    options: question.options,
  };
}

export function createSession(difficulty: Difficulty, questions: StoredQuestion[]) {
  const { seconds } = settingFor(difficulty);
  const now = Date.now();

  const session: Session = {
    id: randomUUID(),
    difficulty,
    questions,
    index: 0,
    score: 0,
    correctAnswers: 0,
    deadline: now + seconds * 1000,
    startedAt: now,
    finished: false,
  };

  sessions.set(session.id, session);

  return {
    gameId: session.id,
    difficulty,
    totalQuestions: questions.length,
    secondsPerQuestion: seconds,
    revealMs: REVEAL_MS,
    index: 0,
    question: toPublic(questions[0]),
    deadline: session.deadline,
  };
}

export type AnswerOutcome =
  | { ok: false; reason: "not_found" | "already_finished" | "out_of_sync" }
  | {
      ok: true;
      correct: boolean;
      correctIndex: number;
      reference: string;
      timedOut: boolean;
      score: number;
      correctAnswers: number;
      status: "playing" | "finished";
      next: { index: number; question: PublicQuestion; deadline: number } | null;
      summary: {
        score: number;
        correctAnswers: number;
        totalQuestions: number;
        durationMs: number;
        difficulty: Difficulty;
      } | null;
    };

export function submitAnswer(gameId: string, index: number, choice: number | null): AnswerOutcome {
  const session = sessions.get(gameId);
  if (!session) return { ok: false, reason: "not_found" };
  if (session.finished) return { ok: false, reason: "already_finished" };
  if (index !== session.index) return { ok: false, reason: "out_of_sync" };

  const now = Date.now();
  const question = session.questions[session.index];
  const { seconds } = settingFor(session.difficulty);

  const timedOut = now > session.deadline + LATENCY_GRACE_MS;
  const correct = !timedOut && choice !== null && choice === question.correct_index;
  const secondsLeft = Math.max(0, Math.ceil((session.deadline - now) / 1000));

  if (correct) {
    session.score += POINTS_PER_CORRECT + secondsLeft * POINTS_PER_SECOND_LEFT;
    session.correctAnswers += 1;
  }

  const isLast = session.index + 1 >= session.questions.length;

  if (isLast) {
    session.finished = true;

    return {
      ok: true,
      correct,
      correctIndex: question.correct_index,
      reference: question.reference,
      timedOut,
      score: session.score,
      correctAnswers: session.correctAnswers,
      status: "finished",
      next: null,
      summary: {
        score: session.score,
        correctAnswers: session.correctAnswers,
        totalQuestions: session.questions.length,
        durationMs: now - session.startedAt,
        difficulty: session.difficulty,
      },
    };
  }

  session.index += 1;
  session.deadline = now + REVEAL_MS + seconds * 1000;

  return {
    ok: true,
    correct,
    correctIndex: question.correct_index,
    reference: question.reference,
    timedOut,
    score: session.score,
    correctAnswers: session.correctAnswers,
    status: "playing",
    next: {
      index: session.index,
      question: toPublic(session.questions[session.index]),
      deadline: session.deadline,
    },
    summary: null,
  };
}
