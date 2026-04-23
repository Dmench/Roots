'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready,    setReady]    = useState(false)
  const [initErr,  setInitErr]  = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [showCf,   setShowCf]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [done,     setDone]     = useState(false)

  useEffect(() => {
    if (!supabase) { router.replace('/'); return }

    const code = new URLSearchParams(window.location.search).get('code')

    if (code) {
      // PKCE flow: exchange the one-time code for a recovery session
      supabase.auth.exchangeCodeForSession(code)
        .then(({ error: err }) => {
          if (err) setInitErr('This link has expired or already been used. Request a new one.')
          else setReady(true)
        })
    } else {
      // Implicit flow or direct navigation: check for existing session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setReady(true)
        else setInitErr('No reset token found. Request a new password reset link.')
      })
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm)  { setError("Passwords don't match."); return }
    if (!supabase) return

    setLoading(true); setError('')
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (err) {
      setError(err.message)
    } else {
      setDone(true)
      setTimeout(() => router.replace('/'), 1800)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: '#0F0E1E' }}>
      <div className="fixed rounded-full pointer-events-none"
        style={{ width: 400, height: 400, top: -140, right: -100, background: '#4744C8', opacity: 0.14, filter: 'blur(80px)' }} />
      <div className="fixed rounded-full pointer-events-none"
        style={{ width: 240, height: 240, bottom: -60, left: -60, background: '#FF3EBA', opacity: 0.10, filter: 'blur(60px)' }} />

      <div className="relative w-full max-w-sm">
        <p className="text-[10px] font-black tracking-[0.28em] uppercase mb-8 text-center"
          style={{ color: 'rgba(245,244,240,0.25)' }}>
          Roots · Reset password
        </p>

        {/* Expired / invalid link */}
        {initErr && (
          <div className="text-center py-6">
            <p className="text-sm mb-6" style={{ color: 'rgba(245,244,240,0.5)' }}>{initErr}</p>
            <button onClick={() => router.replace('/')}
              className="text-xs underline underline-offset-2 hover:opacity-60 transition-opacity"
              style={{ color: 'rgba(245,244,240,0.35)' }}>
              Back to sign in
            </button>
          </div>
        )}

        {/* Loading while exchanging code */}
        {!initErr && !ready && (
          <div className="text-center py-6">
            <div className="w-5 h-5 border border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs" style={{ color: 'rgba(245,244,240,0.25)' }}>Verifying link…</p>
          </div>
        )}

        {/* Success */}
        {done && (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(16,185,129,0.15)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="font-display font-bold text-xl mb-2" style={{ color: '#F5F4F0' }}>Password updated</h2>
            <p className="text-sm" style={{ color: 'rgba(245,244,240,0.35)' }}>Taking you home…</p>
          </div>
        )}

        {/* Form */}
        {ready && !done && (
          <>
            <h2 className="font-display font-bold leading-tight mb-2 text-center"
              style={{ fontSize: '2rem', color: '#F5F4F0' }}>
              Choose a new password
            </h2>
            <p className="text-sm text-center mb-8" style={{ color: 'rgba(245,244,240,0.35)' }}>
              Pick something strong — at least 8 characters.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="New password"
                  autoFocus
                  required
                  className="w-full px-4 py-3.5 pr-11 rounded-xl text-sm focus:outline-none transition-colors"
                  style={{ background: 'rgba(245,244,240,0.07)', border: '1px solid rgba(245,244,240,0.12)', color: '#F5F4F0' }}
                />
                <button type="button" onClick={() => setShowPw(s => !s)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-60 transition-opacity"
                  style={{ color: 'rgba(245,244,240,0.3)' }}>
                  <EyeIcon open={showPw} />
                </button>
              </div>

              <div className="relative">
                <input
                  type={showCf ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className="w-full px-4 py-3.5 pr-11 rounded-xl text-sm focus:outline-none transition-colors"
                  style={{ background: 'rgba(245,244,240,0.07)', border: '1px solid rgba(245,244,240,0.12)', color: '#F5F4F0' }}
                />
                <button type="button" onClick={() => setShowCf(s => !s)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-60 transition-opacity"
                  style={{ color: 'rgba(245,244,240,0.3)' }}>
                  <EyeIcon open={showCf} />
                </button>
              </div>

              {error && <p className="text-xs" style={{ color: '#FF6B6B' }}>{error}</p>}

              <button
                type="submit"
                disabled={!password || !confirm || loading}
                className="w-full py-4 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-30"
                style={{ background: '#F5F4F0', color: '#0F0E1E' }}
              >
                {loading ? '…' : 'Set new password →'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
