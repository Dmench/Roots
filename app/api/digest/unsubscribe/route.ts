import { NextRequest, NextResponse } from 'next/server'
import { createUserClient } from '@/lib/supabase/server'

/**
 * GET /api/digest/unsubscribe
 *
 * One-click unsubscribe from digest emails. Called from email footer link.
 * Uses the user's Supabase session — they must be signed in for this to work.
 * For magic-link users, Vercel/Supabase will have set a session cookie.
 *
 * Sets digest_subscribed = false on their profile, then redirects to profile page.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
    ?? req.headers.get('authorization')?.replace('Bearer ', '')
    ?? ''

  if (!token) {
    // No token — just redirect to profile page where they can manage prefs
    return NextResponse.redirect(new URL('/profile', req.url))
  }

  try {
    const sb = createUserClient(token)
    const { data: { user } } = await sb.auth.getUser()
    if (user) {
      await sb.from('profiles').update({ digest_subscribed: false }).eq('id', user.id)
    }
  } catch { /* silent — redirect regardless */ }

  return NextResponse.redirect(new URL('/profile?unsubscribed=1', req.url))
}
