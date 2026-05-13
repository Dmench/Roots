-- Supabase Storage bucket for cached venue photos.
--
-- Architecture:
--   - One public bucket: venue-photos
--   - Path convention: {city_id}/{venue_id}.jpg
--   - Public read so <img src> works directly; service-role write
--     (the backfill script bypasses RLS) means only server-side code
--     populates the bucket. There is no anon write path.
--
-- After this runs + the upload script populates the bucket, photos
-- are served from Supabase's edge CDN directly — never touch Google
-- again for the cached refs. The /api/places/photo proxy stays as a
-- fallback for newly-discovered venues that haven't been uploaded yet.
--
-- Run this once in the Supabase SQL editor.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'venue-photos',
  'venue-photos',
  true,                                  -- public read for <img src>
  524288,                                -- 512 KB cap per object (photos are ~20–40 KB at 320px)
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public            = excluded.public,
  file_size_limit   = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read policy — anyone can fetch images.
-- Idempotent: drop-then-create so re-running doesn't error.
drop policy if exists "Public read venue photos" on storage.objects;
create policy "Public read venue photos"
  on storage.objects
  for select
  using (bucket_id = 'venue-photos');

-- No insert/update/delete policies needed. The backfill script uses the
-- service role key which bypasses RLS. Anon and authenticated users have
-- zero write access by default.
