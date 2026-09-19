# Verse — Catholic Bible Quiz

A responsive Bible quiz game. Scripture quoted from the New International Version (NIV).

## Structure

```
frontend/   Next.js 16 (App Router, TypeScript), Tailwind v4, Framer Motion, Zustand, next-themes
backend/    Supabase — SQL schema, policies and seed data
README.md
```

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| State | Zustand |
| Theming | next-themes (light / dark) |
| Data & Auth | Supabase (PostgreSQL, Supabase Auth) |

## Running locally

```bash
cd frontend && npm install && npm run dev
```

The app runs at http://localhost:3000.

Environment variables live in `frontend/.env`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

## Database

SQL in `backend/` is applied through the Supabase SQL editor or the Supabase CLI.

## Game rules

| Difficulty | Questions | Seconds per question |
| --- | --- | --- |
| Easy | 10 | 20 |
| Medium | 15 | 15 |
| Hard | 20 | 15 |

Guests play without an account; scores reach the leaderboard once signed in.
