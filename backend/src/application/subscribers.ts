import { subscribe } from "../domain/events.ts";

export function registerSubscribers() {
  subscribe("game.completed", ({ gameId, summary }) => {
    console.log(
      `game.completed ${gameId} ${summary.difficulty} ${summary.score} points ` +
        `${summary.correctAnswers}/${summary.totalQuestions} in ${Math.round(summary.durationMs / 1000)}s`
    );
  });

  subscribe("score.saved", ({ displayName, summary, rank }) => {
    console.log(
      `score.saved ${displayName} ${summary.difficulty} ${summary.score} points ` +
        `rank ${rank ?? "unranked"}`
    );
  });
}
