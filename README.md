# Verse — Catholic Bible Quiz

A responsive Bible quiz game. Scripture quoted from the New International Version (NIV).

## Structure

```
frontend/       Next.js UI only — rendering, animation, theming. No database access, no game rules.
  src/app/        Routes, layout, global styles
  src/components/ Screens
  src/store/      Client state, API calls
backend/        Express API — Supabase connection, game rules, scoring, validation.
  src/            Server, game rules, database access
  sql/            Schema, seed data, migrations
README.md
```

The frontend holds no answers and keeps no score. It renders what the API sends and posts what the player taps.

## Stack

| Layer | Choice |
| --- | --- |
| UI | Next.js 16 (App Router), TypeScript |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Client state | Zustand |
| Theming | next-themes (light / dark) |
| API | Express 5 on Node 24, TypeScript run without a build step |
| Data | Supabase (PostgreSQL) |

## Running locally

Both services run at once, in two terminals.

```bash
cd backend && npm install && npm run dev
```

```bash
cd frontend && npm install && npm run dev
```

The API listens on http://localhost:4000 and the UI on http://localhost:3000.

## Environment

`backend/.env` — never reaches the browser:

```
PORT=4000
CORS_ORIGIN=http://localhost:3000
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

`frontend/.env` — the only variable the UI needs:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Liveness probe |
| POST | `/api/auth/signup` | Creates an account and returns a session |
| POST | `/api/auth/signin` | Exchanges email and password for a session |
| POST | `/api/auth/refresh` | Trades a refresh token for a fresh session |
| GET | `/api/auth/me` | The signed-in player |
| GET | `/api/difficulties` | Question counts and timers, so the UI hard-codes no rules |
| POST | `/api/games` | Starts a round, returns the first question without its answer |
| POST | `/api/games/:gameId/answers` | Grades one answer, returns the score and the next question |
| POST | `/api/games/:gameId/save` | Writes the finished round to the leaderboard |
| GET | `/api/leaderboard` | Best score per player for one difficulty, plus the caller's own standing |

Answers are graded against state the browser never sees. The deadline is enforced on the server clock, so a late answer scores nothing regardless of what the client claims.

Saving a score takes no score from the client. The server writes the total it recorded for that game id, once, and only for a signed-in player.

The leaderboard shows one row per player, their best round at that difficulty, so replaying cannot crowd out other players. A signed-in caller also receives their own rank even when it falls outside the returned page.

## Database

SQL in `backend/sql/` is applied through the Supabase SQL editor or the Supabase CLI.

| File | Purpose |
| --- | --- |
| `sql/schema.sql` | Tables, policies, trigger, `get_quiz` function |
| `sql/seed.sql` | 75 NIV questions across three difficulties |
| `sql/lockdown.sql` | Revokes browser-level access to questions once the backend owns the connection |
| `sql/leaderboard.sql` | Best-score-per-player ranking functions and the unique display name index |

## Tests

```bash
cd backend && npm test && npm run typecheck
```

```bash
cd frontend && npm run typecheck && npm run lint && npm run build
```

Covers scoring, the timeout and latency-grace boundaries, replay and skip-ahead rejection, and the guarantee that a question leaves the server without its answer.

## Game rules

| Difficulty | Questions | Seconds per question |
| --- | --- | --- |
| Easy | 10 | 20 |
| Medium | 15 | 15 |
| Hard | 20 | 15 |

Score is `100 per correct answer + 10 per second left on the clock`.

Guests play without an account. Finishing a round offers sign-in, and the score saves as soon as the account exists.

Display names are unique, case-insensitively.

Supabase email confirmation is on by default, so a new account has to confirm before it can sign in. Turn it off under Authentication -> Providers -> Email if you would rather players start immediately.
