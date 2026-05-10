-- "Where you've called home" — voluntary self-declared geographic history
-- on the profile. ISO 3166-1 alpha-2 codes (e.g. {'BE','JP','PT'}).
--
-- Privacy note: this is intentionally NOT "nationality" or "ethnicity"
-- (which would be GDPR special-category data under Art. 9). It is
-- self-declared lived-in history — a fact, not an identity claim.
-- Users see it on their own card and other authenticated settlers' public
-- cards. Disclosed in the Privacy Policy.
--
-- Run this once in the Supabase SQL editor.

alter table public.profiles
  add column if not exists flags text[] not null default '{}'::text[];

-- No additional index — the column is queried only as part of the full
-- profile row, never filtered standalone (yet).
