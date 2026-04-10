import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const { email, cityId } = await req.json()

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // Supabase not yet configured — acknowledge without persisting
    return NextResponse.json({ ok: true })
  }

  const supabase = createClient(url, key)
  const { error } = await supabase
    .from('waitlist')
    .insert({ email: email.toLowerCase().trim(), city_id: cityId ?? null })

  // Unique constraint violation just means they already signed up — not an error
  if (error && !error.message.includes('unique') && !error.code?.includes('23505')) {
    console.error('[waitlist]', error)
    return NextResponse.json({ error: 'Could not save' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
