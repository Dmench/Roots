'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    if (!supabase) { router.replace('/'); return }

    function getRedirect() {
      const stored = sessionStorage.getItem('roots:returnTo')
      sessionStorage.removeItem('roots:returnTo')
      if (stored && stored.startsWith('/') && !stored.startsWith('/auth')) return stored
      return '/'
    }

    // Listen for the auth event BEFORE exchanging the code, so we can
    // distinguish SIGNED_IN (magic link) from PASSWORD_RECOVERY (reset link).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Don't sign the user in to the app — send them to set a new password.
        router.replace('/auth/reset-password')
      } else if (event === 'SIGNED_IN') {
        router.replace(getRedirect())
      }
    })

    // PKCE flow: exchange the authorization code from the URL for a session.
    // This triggers onAuthStateChange with the correct event type above.
    const code = new URLSearchParams(window.location.search).get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code).catch(() => router.replace('/'))
    }

    return () => subscription.unsubscribe()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#09080F' }}>
      <div className="text-center">
        <div className="w-6 h-6 border border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/30 text-sm tracking-wide">One moment…</p>
      </div>
    </div>
  )
}
