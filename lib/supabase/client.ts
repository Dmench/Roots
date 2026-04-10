import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Singleton — one instance shared across the entire app (including HMR reloads)
declare global {
  // eslint-disable-next-line no-var
  var _rootsSupabase: SupabaseClient | null | undefined
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (typeof window !== 'undefined' && url && key && !globalThis._rootsSupabase) {
  globalThis._rootsSupabase = createClient(url, key)
}

export const supabase: SupabaseClient | null =
  (url && key)
    ? (globalThis._rootsSupabase ?? createClient(url, key))
    : null

export const isConfigured = () => supabase !== null
