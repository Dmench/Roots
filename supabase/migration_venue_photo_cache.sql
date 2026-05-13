-- Persistent cache for Google Places photoRefs per venue.
--
-- Once a photoRef is discovered for a venue (or confirmed absent), it's
-- stored here. Subsequent renders read from this table instead of hitting
-- Google Places — eliminating the recurring text-search burn that was
-- exhausting the daily quota every morning.
--
-- We cache NULLs too. If Google has no photo for a venue, that's also a
-- fact worth remembering — don't ask again.
--
-- Run this once in the Supabase SQL editor.

create table if not exists public.venue_photo_cache (
  venue_id   text        not null,
  city_id    text        not null,
  photo_ref  text,                                 -- nullable: cached "no photo" is meaningful
  found_at   timestamptz not null default now(),
  last_used  timestamptz not null default now(),
  primary key (venue_id, city_id)
);

create index if not exists venue_photo_cache_city_idx
  on public.venue_photo_cache (city_id);

-- RLS — the table is only touched by server-side code via service role,
-- which bypasses RLS. We still enable RLS with no policies so any
-- accidental anon/auth-role queries get refused.
alter table public.venue_photo_cache enable row level security;

-- Optional: nightly stale-purge of entries older than 60 days, so if a
-- venue's photo ID ever rotates we'll rediscover it eventually. Requires
-- pg_cron. Safe to skip for now; old refs that 404 just fall back to the
-- colour block in the UI.
-- select cron.schedule('purge-venue-photo-cache', '0 3 * * *',
--   $$delete from public.venue_photo_cache where found_at < now() - interval '60 days'$$);
