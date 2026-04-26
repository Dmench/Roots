-- ============================================================
-- Roots — Supabase schema  (clean slate, safe to re-run)
-- SQL Editor → new tab → paste → Run
-- ============================================================

-- Drop everything cleanly first (CASCADE removes policies too)
drop table if exists public.waitlist      cascade;
drop table if exists public.posts         cascade;
drop table if exists public.saved_events  cascade;
drop table if exists public.profiles      cascade;

-- ── Profiles ─────────────────────────────────────────────────────────────────

create table public.profiles (
  id                 uuid references auth.users on delete cascade primary key,
  display_name       text,
  city_id            text,
  neighborhood       text,
  arrival_date       text,
  stage              text,
  languages          text[]      default '{}',
  situations         text[]      default '{}',
  completed_task_ids text[]      default '{}',
  saved_task_ids     text[]      default '{}',
  show_in_directory  boolean     default true,
  digest_subscribed  boolean     default true,
  updated_at         timestamptz default now()
);

alter table public.profiles enable row level security;

-- Users can always read their own profile
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- Users can read any profile opted in to the directory (needed for /people page)
create policy "profiles_select_directory" on public.profiles
  for select using (show_in_directory = true);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- ── Posts ─────────────────────────────────────────────────────────────────────

create table public.posts (
  id           uuid        default gen_random_uuid() primary key,
  city_id      text        not null,
  stage        text,
  category     text        not null check (category in ('recommendation', 'question', 'heads-up')),
  text         text        not null check (char_length(text) between 1 and 280),
  author_id    uuid        references auth.users on delete set null,
  author_stage text,
  created_at   timestamptz default now()
);

alter table public.posts enable row level security;

create policy "posts_select_all" on public.posts
  for select using (true);

create policy "posts_insert_auth" on public.posts
  for insert with check (auth.uid() is not null and auth.uid() = author_id);

-- ── Saved Events ─────────────────────────────────────────────────────────────
-- Stores events bookmarked by users. event_id is the stable scraped ID.
-- date_ts is a Unix millisecond timestamp for sorting without parsing date strings.

create table public.saved_events (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        references auth.users on delete cascade not null,
  city_id    text        not null,
  event_id   text        not null,
  title      text        not null,
  date       text        not null,
  time       text        default '',
  venue      text        default '',
  source     text        not null,
  url        text        not null,
  image      text,
  date_ts    bigint      not null,
  saved_at   timestamptz default now() not null,
  unique(user_id, event_id)
);

alter table public.saved_events enable row level security;

create policy "saved_events_select_own" on public.saved_events
  for select using (auth.uid() = user_id);

create policy "saved_events_insert_own" on public.saved_events
  for insert with check (auth.uid() = user_id);

create policy "saved_events_delete_own" on public.saved_events
  for delete using (auth.uid() = user_id);

-- ── Waitlist ──────────────────────────────────────────────────────────────────

create table public.waitlist (
  id         uuid        default gen_random_uuid() primary key,
  email      text        not null,
  city_id    text,
  created_at timestamptz default now(),
  unique (email, city_id)
);

alter table public.waitlist enable row level security;

create policy "waitlist_insert_anyone" on public.waitlist
  for insert with check (true);
