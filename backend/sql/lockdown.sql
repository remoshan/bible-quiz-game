drop policy if exists "Questions are viewable by everyone" on public.questions;

revoke execute on function public.get_quiz(text, integer) from public, anon, authenticated;

grant execute on function public.get_quiz(text, integer) to service_role;
