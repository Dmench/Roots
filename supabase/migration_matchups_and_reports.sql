-- Weekly matchups + post reporting.
--
-- Two unrelated community-product features bundled into one migration
-- because they ship together:
--
-- 1) weekly_matchups + matchup_votes — head-to-head polls (e.g. "Fuse vs
--    C12") pinned above the /connect tips feed. Curated by the founder
--    each Friday; one row per city per week. Vote tap reveals the %
--    split (loss-aversion lever) and unlocks the comments thread.
--
-- 2) post_reports — quiet flag mechanism on UGC posts. Three distinct
--    reporters auto-hide a post via a filter in the posts query. The
--    UNIQUE constraint on (post_id, reporter_id) prevents one-user
--    brigading; reporter_id NOT NULL forces auth.
--
-- Run this once in the Supabase SQL editor.

/* ── 1) Weekly matchups ─────────────────────────────────────────────── */

create table if not exists public.weekly_matchups (
  id              uuid primary key default gen_random_uuid(),
  city_id         text        not null,
  week_start      date        not null,
  option_a_label  text        not null,
  option_b_label  text        not null,
  -- Optional venue IDs into brussels-venues.json. When set, the card
  -- renders with the venue's cached photo from venue-photos Storage.
  option_a_venue_id text,
  option_b_venue_id text,
  -- One-line editorial context shown under the title.
  context         text,
  active          boolean     not null default true,
  created_at      timestamptz not null default now()
);

create unique index if not exists weekly_matchups_active_per_city
  on public.weekly_matchups (city_id) where active;

alter table public.weekly_matchups enable row level security;

-- Anyone authenticated can read the matchup.
create policy "matchups_select_authenticated" on public.weekly_matchups
  for select using (auth.role() = 'authenticated');

-- No insert/update/delete policies — curator writes via service role only.

/* ── 2) Matchup votes ───────────────────────────────────────────────── */

create table if not exists public.matchup_votes (
  matchup_id  uuid        not null references public.weekly_matchups(id) on delete cascade,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  choice      char(1)     not null check (choice in ('a','b')),
  created_at  timestamptz not null default now(),
  primary key (matchup_id, user_id)
);

alter table public.matchup_votes enable row level security;

-- Read access required for the public % split. We expose AGGREGATE counts
-- to anyone authenticated; individual votes stay hidden via the API layer.
create policy "matchup_votes_select_authenticated" on public.matchup_votes
  for select using (auth.role() = 'authenticated');

create policy "matchup_votes_insert_own" on public.matchup_votes
  for insert with check (auth.uid() = user_id);

create policy "matchup_votes_update_own" on public.matchup_votes
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

/* ── 3) Post reports ────────────────────────────────────────────────── */

create table if not exists public.post_reports (
  id           uuid        primary key default gen_random_uuid(),
  post_id      uuid        not null references public.posts(id) on delete cascade,
  reporter_id  uuid        not null references auth.users(id)   on delete cascade,
  reason       text        not null check (reason in ('spam', 'harassment', 'off-topic', 'wrong-info')),
  created_at   timestamptz not null default now(),
  -- One report per user per post — blocks brigade-via-spam-clicks.
  unique (post_id, reporter_id)
);

create index if not exists post_reports_post_idx on public.post_reports (post_id);

alter table public.post_reports enable row level security;

-- No public SELECT — the report queue is private to the curator.
-- Service role bypasses RLS to read.

-- Anyone authenticated can insert a report on any post.
create policy "post_reports_insert_authenticated" on public.post_reports
  for insert with check (auth.uid() = reporter_id);

/* ── 4) Helper view for the posts query ─────────────────────────────── */

-- Used by /connect to skip posts that have crossed the auto-hide threshold.
-- We treat 3 distinct reporters as "review queue + hide from feed."
-- Inlined as a CTE in the query for now; this view exists for clarity if
-- a future query wants to join on hidden state.
create or replace view public.posts_hidden_by_reports as
  select post_id
  from public.post_reports
  group by post_id
  having count(distinct reporter_id) >= 3;
