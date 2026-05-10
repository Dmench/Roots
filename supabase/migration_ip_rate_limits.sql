-- Distributed rate limiting for public API routes (/api/feeds, /api/reddit)
-- Replaces the in-memory limiter in lib/rate-limit.ts which doesn't work across Vercel instances.
-- Run this once in the Supabase SQL editor.

create table if not exists public.ip_rate_limits (
  key         text        primary key,
  count       integer     not null default 1,
  expires_at  timestamptz not null
);

-- RLS: lock the table down. Only the SECURITY DEFINER function below may touch it.
alter table public.ip_rate_limits enable row level security;
-- (No policies — no role can read or write directly.)

create index if not exists ip_rate_limits_expires_at_idx
  on public.ip_rate_limits (expires_at);

-- Atomic check-and-increment. Resets the counter when the window expires.
-- Returns true if the request is within the limit, false if it should be denied.
create or replace function public.check_ip_rate_limit(
  p_key            text,
  p_max            integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count   integer;
  v_now     timestamptz := now();
  v_expires timestamptz := v_now + (p_window_seconds || ' seconds')::interval;
begin
  insert into public.ip_rate_limits(key, count, expires_at)
  values (p_key, 1, v_expires)
  on conflict (key) do update
    set
      count      = case
                     when public.ip_rate_limits.expires_at < v_now then 1
                     else public.ip_rate_limits.count + 1
                   end,
      expires_at = case
                     when public.ip_rate_limits.expires_at < v_now then v_expires
                     else public.ip_rate_limits.expires_at
                   end
  returning count into v_count;

  return v_count <= p_max;
end;
$$;

-- Optional: nightly cleanup of expired rows (requires pg_cron extension).
-- Without this, rows are reused on next-window writes, so the table size is bounded by
-- distinct active keys — fine for a beta. Enable if traffic grows.
-- select cron.schedule('purge-ip-rate-limits', '0 4 * * *',
--   $$delete from public.ip_rate_limits where expires_at < now() - interval '1 hour'$$);
