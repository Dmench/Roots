-- Two small schema additions:
--   1. Add 'intro' to the posts.category enum/check so settlers can post
--      "say hi" intros distinct from tips / questions / heads-up.
--   2. Add posts.neighborhood (nullable text) so the Connect feed can
--      offer a per-hood filter without joining profiles every render.
--      Backfilled at insert time from the author's profile.neighborhood.
--   3. Add profiles.saved_tip_slugs (text[]) so users can save tips to
--      a personal collection visible at /profile/saved.
--
-- Run once in the Supabase SQL editor.

/* ── posts: extend category check, add neighborhood ──────────────── */

-- Older posts table created the column as text with a check constraint.
-- Drop the existing check and re-add it with the new value.
do $$
declare
  cname text;
begin
  select conname into cname
  from pg_constraint
  where conrelid = 'public.posts'::regclass
    and contype  = 'c'
    and pg_get_constraintdef(oid) like '%category%';
  if cname is not null then
    execute format('alter table public.posts drop constraint %I', cname);
  end if;
end $$;

alter table public.posts
  add constraint posts_category_check
  check (category in ('recommendation', 'question', 'heads-up', 'intro'));

alter table public.posts
  add column if not exists neighborhood text;

create index if not exists posts_city_neighborhood_idx
  on public.posts (city_id, neighborhood, created_at desc);

/* ── profiles: saved_tip_slugs ───────────────────────────────────── */

alter table public.profiles
  add column if not exists saved_tip_slugs text[] not null default '{}';
