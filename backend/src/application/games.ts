import { publish } from "../domain/events.ts";
import {
  createSession,
  getSavableSession,
  markSessionSaved,
  settingFor,
  submitAnswer,
  type Difficulty,
} from "../domain/game.ts";
import type { AuthUser } from "../infrastructure/accounts.ts";
import { fetchQuestions } from "../infrastructure/questions.ts";
import { fetchPlayerStanding, saveScore } from "../infrastructure/scores.ts";

export async function startGame(difficulty: Difficulty) {
  const questions = await fetchQuestions(difficulty, settingFor(difficulty).questions);

  if (questions.length === 0) {
    return { ok: false as const, reason: "no_questions" as const };
  }

  return { ok: true as const, game: createSession(difficulty, questions) };
}

export function answerQuestion(gameId: string, index: number, choice: number | null) {
  const outcome = submitAnswer(gameId, index, choice);

  if (!outcome.ok) return outcome;

  publish("answer.graded", {
    gameId,
    index,
    correct: outcome.correct,
    timedOut: outcome.timedOut,
    score: outcome.score,
  });

  if (outcome.summary) {
    publish("game.completed", { gameId, summary: outcome.summary });
  }

  return outcome;
}

export async function saveGameScore(gameId: string, user: AuthUser) {
  const savable = getSavableSession(gameId);

  if (!savable.ok) return savable;

  const { summary } = savable;

  await saveScore({
    user_id: user.id,
    difficulty: summary.difficulty,
    score: summary.score,
    correct_answers: summary.correctAnswers,
    total_questions: summary.totalQuestions,
    duration_ms: summary.durationMs,
  });

  markSessionSaved(gameId);

  const standing = await fetchPlayerStanding(summary.difficulty, user.id);
  const rank = standing?.rank ?? null;

  publish("score.saved", {
    gameId,
    userId: user.id,
    displayName: user.displayName,
    summary,
    rank,
  });

  return { ok: true as const, rank, summary };
}
