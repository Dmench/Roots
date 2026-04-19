import { createClient } from '@supabase/supabase-js'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Creates a Supabase client scoped to a specific user's JWT.
 * RLS policies enforce access — the user can only read/write their own rows.
 */
export function createUserClient(accessToken: string) {
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * Admin client using service role key — bypasses RLS.
 * Only for server-side cron jobs and admin operations. Never expose to the browser.
 */
export function createAdminClient() {
  if (!serviceRole) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
