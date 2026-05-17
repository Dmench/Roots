-- Storage bucket for user-uploaded listing photos (housing + events).
-- Public read so the cards can <img src=...> directly without signed URLs.
-- Authenticated write, scoped to a {user_id}/{filename} path so users
-- can only upload under their own UID folder.
--
-- Run once in the Supabase SQL editor.

-- 1) Create the bucket (idempotent)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-photos',
  'listing-photos',
  true,                                       -- public-readable
  5 * 1024 * 1024,                            -- 5 MB cap per file
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public            = excluded.public,
      file_size_limit   = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2) Policies: public read, authenticated insert/update/delete within own
--    user-id folder. The path convention enforced by the client is
--    `{auth.uid()}/{timestamp}-{filename}` — the policy checks the first
--    path segment matches the caller's UID.

-- Public read
drop policy if exists "listing-photos-public-read" on storage.objects;
create policy "listing-photos-public-read"
  on storage.objects for select
  using (bucket_id = 'listing-photos');

-- Authenticated insert into own folder
drop policy if exists "listing-photos-auth-insert-own" on storage.objects;
create policy "listing-photos-auth-insert-own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated delete own files (so users can remove a listing's photo)
drop policy if exists "listing-photos-auth-delete-own" on storage.objects;
create policy "listing-photos-auth-delete-own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
