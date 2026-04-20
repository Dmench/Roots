'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user,    setUser]    = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }

    // onAuthStateChange fires INITIAL_SESSION synchronously from localStorage —
    // no network call, no delay. Subsequent events (SIGNED_IN, SIGNED_OUT, etc.)
    // update state as they happen.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'INITIAL_SESSION') setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    if (!supabase) return { error: new Error('Sign-in not available') }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ?? null }
  }

  const signUp = async (email: string, password: string, displayName?: string): Promise<{ error: Error | null }> => {
    if (!supabase) return { error: new Error('Sign-up not available') }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName ?? '' } },
    })
    return { error: error ?? null }
  }

  const signInWithMagicLink = async (email: string): Promise<{ error: Error | null }> => {
    if (!supabase) return { error: new Error('Sign-in not available') }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    return { error: error ?? null }
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return { user, loading, signIn, signUp, signInWithMagicLink, signOut }
}
