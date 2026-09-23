select u.id, u.display_name, u.created_at, count(l.id) as leaderboard_rows
from public.users u
left join public.leaderboard l on l.user_id = u.id
group by u.id, u.display_name, u.created_at
order by u.created_at;

delete from auth.users
where id in (select id from public.users);

alter table public.questions alter column translation set default 'CPDV';
