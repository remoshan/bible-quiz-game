import { rateLimit } from "express-rate-limit";

const limit = (windowMs: number, max: number, error: string) =>
  rateLimit({
    windowMs,
    limit: max,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error },
  });

export const startLimit = limit(60_000, 30, "Too many rounds started. Wait a minute and try again.");

export const signUpLimit = limit(
  60 * 60_000,
  5,
  "Too many sign-up attempts. Please try again in an hour."
);

export const signInLimit = limit(
  15 * 60_000,
  20,
  "Too many sign-in attempts. Please try again in a few minutes."
);
