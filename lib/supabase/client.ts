import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Singleton — one instance shared across the entire app (including HMR reloads)
declare global {
  // eslint-disable-next-line no-var
  var _rootsSupabase: SupabaseClient | undefined
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function makeClient(): SupabaseClient {
  return createClient(url!, key!, {
    auth: {
      autoRefreshToken:  true,
      persistSession:    true,
      detectSessionInUrl: true,
    },
  })
}

if (url && key && typeof globalThis._rootsSupabase === 'undefined') {
  globalThis._rootsSupabase = makeClient()
}

export const supabase: SupabaseClient | null = (url && key)
  ? (globalThis._rootsSupabase ?? makeClient())
  : null

export const isConfigured = () => supabase !== null
