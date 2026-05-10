-- Enable Supabase Realtime on posts + post_comments so the connect page can
-- subscribe to INSERT events and append new content live.
--
-- Note: Supabase's dashboard has two unrelated features both labeled with
-- "Replication" terminology:
--   - "Database > Replication"  → Read Replicas (paid, NOT what we want)
--   - Realtime publications     → free, configured here via SQL
--
-- The supabase_realtime publication is what the Realtime service listens on.
-- Adding a table to it is exactly what the dashboard's "Enable Realtime" toggle
-- does under the hood. Idempotent — safe to re-run.

alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.post_comments;

-- Verify (optional — run separately to inspect):
-- select schemaname, tablename from pg_publication_tables
-- where pubname = 'supabase_realtime';
