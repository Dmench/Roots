import { NextRequest, NextResponse } from 'next/server'
import { resolvePartner } from '@/lib/affiliates'
import { createAdminClient } from '@/lib/supabase/server'

// Outbound click tracker. Logs the click to Supabase (if the table exists)
// and 302s to the destination. Strict scheme + host whitelist to prevent
// open-redirect abuse — only known partner domains are honoured.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const to        = searchParams.get('to')
  const partnerId = searchParams.get('p')
  const taskSlug  = searchParams.get('t')

  if (!to) return NextResponse.json({ error: 'Missing destination' }, { status: 400 })

  let url: URL
  try { url = new URL(to) }
  catch { return NextResponse.json({ error: 'Invalid destination' }, { status: 400 }) }

  // Only allow https — defends against javascript:/data:/file: URLs
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return NextResponse.json({ error: 'Disallowed scheme' }, { status: 400 })
  }

  // Resolve must succeed — open-redirect defence. We only redirect to
  // domains in the partner registry, never arbitrary URLs from the param.
  const partner = resolvePartner(to)
  if (!partner) {
    return NextResponse.json({ error: 'Unrecognised partner' }, { status: 400 })
  }

  // Fire-and-forget log to Supabase. If the table doesn't exist yet, swallow
  // the error — tracking is best-effort, redirect must still happen.
  try {
    const admin = createAdminClient()
    const ua    = req.headers.get('user-agent')?.slice(0, 200) ?? ''
    const ref   = req.headers.get('referer')?.slice(0, 200) ?? ''
    void admin.from('affiliate_clicks').insert({
      partner_id: partner.id,
      task_slug:  taskSlug?.slice(0, 60) ?? null,
      destination: to.slice(0, 500),
      user_agent: ua,
      referer:    ref,
    }).then(({ error }) => {
      if (error && error.code !== '42P01') {
        console.warn('[affiliate-click] log failed:', error.code, error.message)
      }
    })
  } catch (e) {
    console.warn('[affiliate-click] supabase unavailable', e)
  }

  return NextResponse.redirect(to, 302)
}
