-- Per-user rate limit on community posts.
-- Mirrors the increment_ask_count pattern but uses the posts table itself as
-- the source of truth — no extra table needed.
-- Run this once in the Supabase SQL editor.

create or replace function public.check_post_rate_limit(
  uid          uuid,
  max_per_min  integer
) returns boolean
language sql
security definer
set search_path = public
as $$
  select count(*) < max_per_min
  from public.posts
  where author_id = uid
    and created_at > now() - interval '1 minute';
$$;

-- Allow authenticated users to call the function (RLS on posts still applies
-- to the rows, but security definer lets the count read across users).
grant execute on function public.check_post_rate_limit(uuid, integer) to authenticated;
