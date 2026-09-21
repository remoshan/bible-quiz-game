create unique index if not exists users_display_name_key on public.users (lower(display_name));

create or replace function public.get_leaderboard(p_difficulty text, p_limit integer)
returns table (
  id uuid,
  user_id uuid,
  display_name text,
  score integer,
  correct_answers smallint,
  total_questions smallint,
  duration_ms integer,
  created_at timestamptz
)
language sql
stable
set search_path = ''
as $$
  select best.id, best.user_id, u.display_name, best.score, best.correct_answers,
         best.total_questions, best.duration_ms, best.created_at
  from (
    select distinct on (l.user_id) l.*
    from public.leaderboard l
    where l.difficulty = p_difficulty
    order by l.user_id, l.score desc, l.created_at asc
  ) best
  join public.users u on u.id = best.user_id
  order by best.score desc, best.created_at asc
  limit least(greatest(p_limit, 1), 100);
$$;

create or replace function public.get_player_standing(p_difficulty text, p_user_id uuid)
returns table (
  rank bigint,
  score integer,
  correct_answers smallint,
  total_questions smallint,
  duration_ms integer,
  created_at timestamptz
)
language sql
stable
set search_path = ''
as $$
  with best as (
    select distinct on (l.user_id) l.*
    from public.leaderboard l
    where l.difficulty = p_difficulty
    order by l.user_id, l.score desc, l.created_at asc
  )
  select
    (
      select count(*) + 1
      from best rival
      where rival.score > mine.score
         or (rival.score = mine.score and rival.created_at < mine.created_at)
    ) as rank,
    mine.score,
    mine.correct_answers,
    mine.total_questions,
    mine.duration_ms,
    mine.created_at
  from best mine
  where mine.user_id = p_user_id;
$$;

revoke execute on function public.get_leaderboard(text, integer) from public, anon, authenticated;
revoke execute on function public.get_player_standing(text, uuid) from public, anon, authenticated;

grant execute on function public.get_leaderboard(text, integer) to service_role;
grant execute on function public.get_player_standing(text, uuid) to service_role;
