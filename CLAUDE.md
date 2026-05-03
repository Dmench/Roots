@AGENTS.md

# Roots — Product & Engineering Guide

## What Roots is

Roots helps anyone new to a city get set up, find their footing, and actually feel at home. The product is for anyone who just moved — from another country, another city, another neighbourhood. The goal is belonging, not just admin completion.

The current implementation leans toward international movers because Brussels has a lot of expats and their admin needs are complex. But the product vision is broader: someone moving from Birmingham to London should find Roots just as useful as someone moving from New York to Brussels. Don't build features that only make sense for international expats.

## Current state (as of May 2026)

- **Active city: Brussels only.** Lisbon, Berlin, Barcelona, Amsterdam, Prague are stubs in `lib/data/cities.ts` — not live, not prioritised.
- **Tech stack:** Next.js 16 App Router, TypeScript strict, Tailwind CSS, Supabase (auth + postgres)
- **Auth:** Supabase email/password. Auth gate on city pages. Rate limit on `/api/ask` (20/day) via `ask_rate_limits` table + `increment_ask_count()` postgres function.

## The four product sections

| Section | Route | What it does |
|---------|-------|-------------|
| **Hub** | `/[city]` | Dashboard: weather, events, transport alerts, rent data, community pulse |
| **Settle** | `/[city]/settle` | Staged task checklist (planning → just arrived → settling → settled) |
| **Ask** | `/[city]/ask` | AI assistant (Claude) answering city-specific questions with context about user's stage/situation |
| **Connect** | `/[city]/connect` | Community feed — tips, questions, heads-up, events, news, reddit. Auth-gated. |
| **Eat** | `/[city]/eat` | Curated neighbourhood food guide with venue discovery + map |

## Design language

- **Colours:** `#252450` brand navy, `#4744C8` primary purple, `#FAB400` amber, `#FF3EBA` pink, `#0A0A0A` near-black on white
- **Typography:** `font-display` for headlines (black weight, tight leading), `text-[10px] tracking-[0.22em] uppercase font-black` for section labels
- **Aesthetic:** editorial, high-contrast, flat — no card shadows, no rounded corners on interactive elements, no gradients inside content areas
- **Stage colours:** planning `#6865CC`, just_arrived `#B88A00`, settling `#1A8FAD`, settled `#0E9B6B`

## Data sources (Brussels)

- **Rentals:** StatBel CSV (annual survey, 7-day cache, hardcoded fallback)
- **Transport:** STIB RSS + page scrape (5-min cache, fail-open)
- **Events:** visitbrussels.com + cultural venues scrape + Meetup (fail-open)
- **Weather:** Open-Meteo (free, no key required)
- **Places/photos:** Google Places API (proxied via `/api/places/photo`, auth-gated)

## Feature discipline

**Do not add features without a clear user need.** The product already has a lot of surface area. Before adding anything:
1. Does it serve someone new to a city (not just an expat)?
2. Does it work for Brussels specifically — not a generic pattern we'll "fill in later"?
3. Does it make the core loop (settle → ask → connect → eat) stronger?

**Known good ideas to build (in rough priority):**
- Neighbourhood-level community feed fragmentation (tips filtered by hood)
- "This helped" upvote on community tips (flywheel for content quality)
- Settle progress share card (milestone → social currency)
- Discovery bingo card (hidden gems checklist — photo-shareable, city-native)

**Explicitly not building yet:**
- Multi-city rollout mechanics (wait until Brussels is excellent)
- City visual identity differentiation per city (premature, only one live city)
- Push notifications / digest emails (profile toggle exists but not wired)
- Native app

## Code conventions

- Server components for data fetching, client components (`'use client'`) for interactivity
- Async server components wrapped in `<Suspense>` with `<SidebarSkeleton>` fallback for all slow data widgets
- All external fetches use `AbortSignal.timeout()` and `console.warn` on failure — never throw, always fail gracefully
- `updateProfile` in `use-profile.ts` is optimistic-first: local state updates synchronously, Supabase fires in background
- Rate limit via `increment_ask_count(uid, day)` postgres RPC — atomic, not a two-step upsert/update
- Photo proxy at `/api/places/photo` validates `photoRef` via regex before forwarding to Google — SSRF protection

## Supabase schema (key tables)

- `profiles` — user profile (stage, situations, arrival_date, city_id, completed_task_ids, spots, etc.)
- `posts` — community posts (city_id, category, text, author_stage)
- `post_comments` — comments on posts
- `ask_rate_limits` — (user_id, date, count) — run `supabase/migration_ask_rate_limits.sql` to create
- `follows` — (follower_id, following_id) — user follow graph

## Running locally

```bash
npm install
npm run dev        # http://localhost:3000
```

Requires `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
GOOGLE_PLACES_API_KEY=
```
