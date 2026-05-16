-- Affiliate click log. Append-only, service-role writes, no user-readable rows.
-- The revenue surface — every click that earns Roots a partner commission
-- lands here for attribution and aggregate reporting.

create table if not exists affiliate_clicks (
  id           uuid primary key default gen_random_uuid(),
  partner_id   text not null,
  task_slug    text,
  destination  text not null,
  user_agent   text,
  referer      text,
  ip_country   text,        -- populated by Vercel header in a future iteration
  created_at   timestamptz not null default now()
);

create index if not exists affiliate_clicks_partner_created_idx
  on affiliate_clicks (partner_id, created_at desc);
create index if not exists affiliate_clicks_task_created_idx
  on affiliate_clicks (task_slug, created_at desc);

alter table affiliate_clicks enable row level security;

-- No public read or write — service-role only.
-- (The /api/affiliate-click route uses the admin client.)
