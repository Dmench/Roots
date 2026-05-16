-- First Brussels matchup — run AFTER migration_matchups_and_reports.sql
-- to seed the live card on /connect.
--
-- Set option_a/b_venue_id to a venue_id from brussels-venues.json — the
-- card pulls the photo from venue-photos Storage automatically.
--
-- Only one matchup can be active per city at a time (unique index on
-- city_id WHERE active). Deactivate the previous one before inserting a
-- new week.

-- (1) Deactivate any existing active matchup first (no-op on first run).
update public.weekly_matchups
set active = false
where city_id = 'brussels' and active = true;

-- (2) Insert this week's matchup.
insert into public.weekly_matchups (
  city_id, week_start, option_a_label, option_b_label,
  option_a_venue_id, option_b_venue_id, context, active
) values (
  'brussels',
  date_trunc('week', current_date)::date,
  'Fuse',
  'C12',
  'curated-fuse',
  'curated-c12',
  'The Brussels techno argument that won''t die — both legendary, both wildly different rooms. Where are you Friday night?',
  true
);

/* ── Future weeks — copy this template, deactivate the old one, insert new ──

  Examples queued for upcoming weeks:

  • Koku Ramen vs Umamido — ramen
    (Umamido isn't in the venue corpus yet → leave venue IDs null,
     or add Umamido via brussels-venues.json + venue_photo_cache first.)

  • Maison Antoine vs Fritland — frites
  • Café Belga vs Mer du Nord — terrace
  • Cantillon vs Brussels Beer Project — gueuze / craft
  • Goupil le Fol vs Poechenellekelder — eccentric old bars
  • Old Boy vs The Modern Alchemist — cocktails
  • Châtelain market vs Flagey market — Saturday morning ritual
*/
