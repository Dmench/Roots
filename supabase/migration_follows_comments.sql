-- ── follows ──────────────────────────────────────────────────────────────────
create table public.follows (
  follower_id  uuid references auth.users on delete cascade not null,
  following_id uuid references auth.users on delete cascade not null,
  created_at   timestamptz default now(),
  primary key (follower_id, following_id)
);
alter table public.follows enable row level security;
create policy "follows_select_all"  on public.follows for select using (true);
create policy "follows_insert_own"  on public.follows for insert with check (auth.uid() = follower_id);
create policy "follows_delete_own"  on public.follows for delete  using (auth.uid() = follower_id);

-- ── post_comments ─────────────────────────────────────────────────────────────
create table public.post_comments (
  id         uuid        default gen_random_uuid() primary key,
  post_id    uuid        references public.posts on delete cascade not null,
  author_id  uuid        references auth.users   on delete set null,
  text       text        not null check (char_length(text) between 1 and 280),
  created_at timestamptz default now()
);
alter table public.post_comments enable row level security;
create policy "comments_select_all"   on public.post_comments for select using (true);
create policy "comments_insert_auth"  on public.post_comments for insert
  with check (auth.uid() is not null and auth.uid() = author_id);
create policy "comments_delete_own"   on public.post_comments for delete  using (auth.uid() = author_id);
