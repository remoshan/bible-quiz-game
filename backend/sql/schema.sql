create extension if not exists pgcrypto;

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('guess_the_book', 'fill_in_the_blank', 'who_said_it')),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  prompt text not null,
  verse_text text not null,
  reference text not null,
  translation text not null default 'NIV',
  options text[] not null check (array_length(options, 1) = 4),
  correct_index smallint not null check (correct_index between 0 and 3),
  created_at timestamptz not null default now()
);

create index questions_difficulty_idx on public.questions (difficulty);

create table public.leaderboard (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  score integer not null check (score >= 0),
  correct_answers smallint not null check (correct_answers >= 0),
  total_questions smallint not null check (total_questions > 0),
  duration_ms integer not null check (duration_ms >= 0),
  created_at timestamptz not null default now(),
  constraint leaderboard_correct_within_total check (correct_answers <= total_questions)
);

create index leaderboard_rank_idx on public.leaderboard (difficulty, score desc, created_at);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Player'
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create function public.get_quiz(p_difficulty text, p_count integer)
returns setof public.questions
language sql
set search_path = ''
as $$
  select *
  from public.questions
  where difficulty = p_difficulty
  order by random()
  limit least(greatest(p_count, 1), 50);
$$;

revoke execute on function public.get_quiz(text, integer) from public, anon, authenticated;
grant execute on function public.get_quiz(text, integer) to service_role;

alter table public.users enable row level security;
alter table public.questions enable row level security;
alter table public.leaderboard enable row level security;

create policy "Profiles are viewable by everyone"
  on public.users for select
  using (true);

create policy "Players can update their own profile"
  on public.users for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Leaderboard is viewable by everyone"
  on public.leaderboard for select
  using (true);

create policy "Players can submit their own scores"
  on public.leaderboard for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
