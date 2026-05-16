-- "This helped" on tips + "Like" on comments.
--
-- Two compounding-signal primitives. Every tap ranks the corpus,
-- surfaces good content to next month's arrivals, and turns lurkers
-- (the silent 90%) into contributors at one-tap cost.
--
-- Both tables: PK (target_id, user_id) so each user can only
-- contribute one signal per target. The toggle endpoints handle
-- add/remove cleanly without dedupe headaches.
--
-- Run this once in the Supabase SQL editor.

/* ── post_helpful ─────────────────────────────────────────────────── */

create table if not exists public.post_helpful (
  post_id     uuid        not null references public.posts(id) on delete cascade,
  user_id     uuid        not null references auth.users(id)   on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_helpful_post_idx on public.post_helpful (post_id);

alter table public.post_helpful enable row level security;

-- Anyone authenticated can read aggregates (count per post).
create policy "post_helpful_select_authenticated" on public.post_helpful
  for select using (auth.role() = 'authenticated');

create policy "post_helpful_insert_own" on public.post_helpful
  for insert with check (auth.uid() = user_id);

create policy "post_helpful_delete_own" on public.post_helpful
  for delete using (auth.uid() = user_id);

/* ── comment_likes ────────────────────────────────────────────────── */

create table if not exists public.comment_likes (
  comment_id  uuid        not null references public.post_comments(id) on delete cascade,
  user_id     uuid        not null references auth.users(id)           on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index if not exists comment_likes_comment_idx on public.comment_likes (comment_id);

alter table public.comment_likes enable row level security;

create policy "comment_likes_select_authenticated" on public.comment_likes
  for select using (auth.role() = 'authenticated');

create policy "comment_likes_insert_own" on public.comment_likes
  for insert with check (auth.uid() = user_id);

create policy "comment_likes_delete_own" on public.comment_likes
  for delete using (auth.uid() = user_id);
