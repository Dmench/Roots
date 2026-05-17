-- Extend posts table for listings + events.
--
-- Three new categories layered on top of the existing
-- recommendation/question/heads-up/intro vocabulary:
--   housing-offer  — "Chambre disponible Saint-Gilles" style ad
--   housing-wanted — "Looking for furnished studio Tram 7" style ad
--   event          — user-submitted event with date/venue/link
--
-- Plus nullable structured columns that the new composers fill in.
-- Existing posts (tips/questions/heads-up/intro) leave these null
-- and continue to render as before.
--
-- Run once in the Supabase SQL editor.

-- 1) Replace the existing category check constraint with the new vocab
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
  check (category in (
    'recommendation',
    'question',
    'heads-up',
    'intro',
    'housing-offer',
    'housing-wanted',
    'event'
  ));

-- 2) Structured fields used by the new composers + cards
alter table public.posts
  add column if not exists title         text,        -- listing/event headline
  add column if not exists price         text,        -- "€950/month" — kept flexible
  add column if not exists dates         text,        -- "July → May" — flexible
  add column if not exists photo_url     text,        -- Supabase Storage path OR external URL
  add column if not exists event_date    timestamptz, -- for category='event' only
  add column if not exists event_venue   text,        -- for events
  add column if not exists event_url     text;        -- ticket / RSVP / details link

-- 3) Helpful indexes for the new filters
create index if not exists posts_category_city_created_idx
  on public.posts (city_id, category, created_at desc);

create index if not exists posts_event_date_idx
  on public.posts (event_date desc)
  where category = 'event';

-- 4) (Optional) Storage bucket for user-uploaded listing photos.
-- The image upload UI is not wired in the first MVP — composers accept
-- a URL string for now. Create the bucket via the Supabase dashboard
-- with name 'listing-photos', public read, authenticated-write RLS
-- when ready to switch to native upload.
