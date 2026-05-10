-- Add neighborhood column to posts so the community feed can be filtered by hood.
-- Stored as plain text matching the labels in lib/data/cities.ts NEIGHBORHOODS map.
-- Run this once in the Supabase SQL editor.

alter table public.posts
  add column if not exists neighborhood text;

-- Index supports filtering by (city_id, neighborhood) without a full table scan
-- once the table grows. Partial index — only rows that have a neighborhood set.
create index if not exists posts_city_neighborhood_idx
  on public.posts (city_id, neighborhood)
  where neighborhood is not null;
