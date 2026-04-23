'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthCtx {
  user:          User | null
  loading:       boolean
  signIn:        (email: string, password: string) => Promise<{ error: Error | null }>
  signUp:        (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  signOut:       () => Promise<void>
}

const AuthContext = createContext<AuthCtx>({
  user:          null,
  loading:       true,
  signIn:        async () => ({ error: null }),
  signUp:        async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
  signOut:       async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }

    // Single subscription for the entire app lifetime (layout never unmounts).
    // INITIAL_SESSION fires from localStorage — no network call, no delay.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'INITIAL_SESSION') setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Not configured') }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ?? null }
  }, [])

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    if (!supabase) return { error: new Error('Not configured') }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName ?? '' } },
    })
    return { error: error ?? null }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) return { error: new Error('Not configured') }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Send directly to the set-password page — no callback detour
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    return { error: error ?? null }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, resetPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
