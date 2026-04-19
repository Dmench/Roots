'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    if (!supabase) { router.replace('/'); return }

    const params = new URLSearchParams(window.location.search)
    const code   = params.get('code')

    function getRedirect() {
      const stored = sessionStorage.getItem('roots:returnTo')
      sessionStorage.removeItem('roots:returnTo')
      if (stored && stored.startsWith('/') && !stored.startsWith('/auth')) return stored
      return '/profile'
    }

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(() => router.replace(getRedirect()))
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') router.replace(getRedirect())
    })

    return () => subscription.unsubscribe()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#09080F' }}>
      <div className="text-center">
        <div className="w-6 h-6 border border-gold/40 border-t-gold/80 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-cream/30 text-sm tracking-wide">Signing you in…</p>
      </div>
    </div>
  )
}
