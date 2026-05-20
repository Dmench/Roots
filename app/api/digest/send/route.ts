import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/server'
import { getEvents, isBroadAppeal } from '@/lib/data/events'
import { getRedditPosts } from '@/lib/data/reddit'
import { getNews } from '@/lib/data/news'
import { buildDigestEmail } from '@/lib/email/digest-template'
import { getCity } from '@/lib/data/cities'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://roots.so'
// Default to Resend's built-in verified sender so cron works out of the box.
// Override with RESEND_FROM_EMAIL once a custom domain is verified in Resend
// (e.g. "digest@roots.so", "hello@mail.roots.so").
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

/**
 * GET /api/digest/send
 *
 * Called by Vercel Cron every Monday at 08:00 UTC.
 * Protected by CRON_SECRET — Vercel automatically sends it via Authorization header.
 *
 * To trigger manually:
 *   curl -H "Authorization: Bearer <CRON_SECRET>" https://yourapp.vercel.app/api/digest/send
 */
export async function GET(req: NextRequest) {
  // ── Auth — timing-safe comparison prevents timing attacks on the secret ─────
  const { timingSafeEqual, createHmac } = await import('crypto')

  const authHeader = req.headers.get('authorization') ?? ''
  const secret     = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Hash both sides with the same HMAC key so the buffers are always equal length,
  // then compare with timingSafeEqual — prevents timing side-channel attacks.
  const key = 'roots-cron-compare'
  const ha  = createHmac('sha256', key).update(authHeader).digest()
  const hb  = createHmac('sha256', key).update(`Bearer ${secret}`).digest()
  if (!timingSafeEqual(ha, hb)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const admin  = createAdminClient()

  // ── Fetch all subscribed profiles ─────────────────────────────────────────
  const { data: profiles, error: profilesErr } = await admin
    .from('profiles')
    .select('id, display_name, city_id, digest_subscribed')
    .eq('digest_subscribed', true)
    .not('city_id', 'is', null)

  if (profilesErr || !profiles?.length) {
    console.log('[digest] no subscribers or error', profilesErr)
    return NextResponse.json({ ok: true, sent: 0 })
  }

  // ── Group by city — fetch events/reddit/news once per city ────────────────
  const cityIds = [...new Set(profiles.map(p => p.city_id as string).filter(Boolean))]

  const cityData = await Promise.all(
    cityIds.map(async cityId => {
      const [allEvents, reddit, news] = await Promise.all([
        getEvents(cityId),
        getRedditPosts(cityId, 3),
        getNews(cityId, 3),
      ])
      // Deduplicate events (same logic as city page)
      const seen = new Map<string, typeof allEvents[0]>()
      for (const ev of allEvents) {
        const key = ev.title.toLowerCase().replace(/[^a-z0-9]/g, '')
        if (!seen.has(key)) seen.set(key, ev)
      }
      return { cityId, events: [...seen.values()], reddit, news }
    })
  )

  const cityDataMap = Object.fromEntries(cityData.map(c => [c.cityId, c]))

  // ── Date range label for subject ──────────────────────────────────────────
  const now = new Date()
  const mon = new Date(now); mon.setDate(now.getDate() - now.getDay() + 1)
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
  const fmtShort = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })
  const fmtLong  = (d: Date) => d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const dateRange = `${fmtShort(mon)} – ${fmtShort(sun)} ${fmtLong(sun)}`

  // ── Send one email per user ───────────────────────────────────────────────
  let sent = 0; let failed = 0
  const BATCH = 10 // Resend free tier: 100/day, 10 concurrent safe

  for (let i = 0; i < profiles.length; i += BATCH) {
    const batch = profiles.slice(i, i + BATCH)

    await Promise.all(batch.map(async profile => {
      const cityId = profile.city_id as string
      const city   = getCity(cityId)
      if (!city) return

      const data = cityDataMap[cityId]
      if (!data) return

      // Get user's email from Supabase auth
      const { data: { user }, error: userErr } = await admin.auth.admin.getUserById(profile.id)
      if (userErr || !user?.email) return

      // Fetch this user's saved events (upcoming only)
      const { data: savedRows } = await admin
        .from('saved_events')
        .select('*')
        .eq('user_id', profile.id)
        .eq('city_id', cityId)
        .gt('date_ts', Date.now())
        .order('date_ts', { ascending: true })
        .limit(5)

      const savedEvents = (savedRows ?? []).map(r => ({
        id: r.event_id, title: r.title, date: r.date, time: r.time,
        venue: r.venue, source: r.source, url: r.url, dateObj: new Date(r.date_ts), image: r.image ?? undefined,
      }))

      const savedIds = new Set(savedEvents.map(e => e.id))

      // Curated picks: upcoming broad-appeal events the user hasn't saved
      const picks = data.events
        .filter(ev => !savedIds.has(ev.id) && isBroadAppeal(ev))
        .slice(0, 3)

      const firstName = (profile.display_name as string | null)?.split(' ')[0] ?? 'there'

      const { html, subject } = buildDigestEmail({
        cityName:    city.name,
        cityId,
        firstName,
        dateRange,
        savedEvents,
        picks,
        reddit:      data.reddit,
        news:        data.news,
        appUrl:      APP_URL,
      })

      const { error: sendErr } = await resend.emails.send({
        from:    `${city.name} Digest <${FROM_EMAIL}>`,
        to:      user.email,
        subject,
        html,
      })

      if (sendErr) {
        console.error(`[digest] failed for ${user.email}:`, sendErr)
        failed++
      } else {
        sent++
      }
    }))
  }

  console.log(`[digest] done — sent: ${sent}, failed: ${failed}`)
  return NextResponse.json({ ok: true, sent, failed })
}
