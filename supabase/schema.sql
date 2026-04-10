-- ============================================================
-- Roots — Supabase schema  (clean slate, safe to re-run)
-- SQL Editor → new tab → paste → Run
-- ============================================================

-- Drop everything cleanly first (CASCADE removes policies too)
drop table if exists public.waitlist cascade;
drop table if exists public.posts    cascade;
drop table if exists public.profiles cascade;

-- ── Profiles ─────────────────────────────────────────────────────────────────

create table public.profiles (
  id                 uuid references auth.users on delete cascade primary key,
  display_name       text,
  city_id            text,
  arrival_date       text,
  stage              text,
  situations         text[]      default '{}',
  completed_task_ids text[]      default '{}',
  saved_task_ids     text[]      default '{}',
  updated_at         timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

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
