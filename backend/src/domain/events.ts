import { EventEmitter } from "node:events";
import type { GameSummary } from "./game.ts";

export type DomainEvents = {
  "answer.graded": {
    gameId: string;
    index: number;
    correct: boolean;
    timedOut: boolean;
    score: number;
  };
  "game.completed": {
    gameId: string;
    summary: GameSummary;
  };
  "score.saved": {
    gameId: string;
    userId: string;
    displayName: string;
    summary: GameSummary;
    rank: number | null;
  };
};

type DomainEvent = keyof DomainEvents;

const emitter = new EventEmitter();

export function publish<K extends DomainEvent>(name: K, payload: DomainEvents[K]) {
  emitter.emit(name, payload);
}

export function subscribe<K extends DomainEvent>(
  name: K,
  handler: (payload: DomainEvents[K]) => void
) {
  const guarded = (payload: DomainEvents[K]) => {
    try {
      handler(payload);
    } catch (error) {
      console.error(`Subscriber for ${name} failed:`, error);
    }
  };

  emitter.on(name, guarded);

  return () => {
    emitter.off(name, guarded);
  };
}

export function subscriberCount(name: DomainEvent) {
  return emitter.listenerCount(name);
}
