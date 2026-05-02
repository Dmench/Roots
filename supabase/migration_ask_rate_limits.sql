-- Ask rate limiting table
-- Tracks per-user daily question counts for /api/ask (limit: 20/day)
-- Run this once in the Supabase SQL editor.

create table if not exists public.ask_rate_limits (
  user_id uuid    not null references auth.users(id) on delete cascade,
  date    date    not null default current_date,
  count   integer not null default 1,
  primary key (user_id, date)
);

-- RLS: users can only see their own row; service role handles upserts via API
alter table public.ask_rate_limits enable row level security;

create policy "Users can read own rate limit"
  on public.ask_rate_limits for select
  using (auth.uid() = user_id);

-- Index for fast lookups (the primary key covers this, but explicit for clarity)
create index if not exists ask_rate_limits_user_date_idx
  on public.ask_rate_limits (user_id, date);

-- Auto-purge rows older than 7 days (optional, keeps the table small)
-- This requires pg_cron extension enabled in Supabase dashboard.
-- select cron.schedule('purge-rate-limits', '0 4 * * *',
--   $$delete from public.ask_rate_limits where date < current_date - interval '7 days'$$);
