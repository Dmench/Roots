'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'

interface Props {
  isOpen:    boolean
  onClose:   () => void
  returnTo?: string
}

type View = 'signin' | 'signup' | 'magic-sent' | 'confirm-email' | 'reset-sent'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function PasswordInput({
  value, onChange, placeholder, id,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  id: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full px-4 py-3 pr-11 bg-white border border-sand rounded-xl text-sm text-espresso placeholder:text-walnut/30 focus:outline-none focus:border-walnut/30 transition-colors"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-walnut/30 hover:text-walnut/60 transition-colors"
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  )
}

export function AuthModal({ isOpen, onClose, returnTo }: Props) {
  const router = useRouter()
  const { signIn, signUp, signInWithMagicLink, resetPassword } = useAuth()

  const [view,      setView]      = useState<View>('signin')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [name,      setName]      = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return
    const dest = returnTo ?? window.location.pathname
    const safe = dest.startsWith('/auth') || dest === '/' ? '/profile' : dest
    sessionStorage.setItem('roots:returnTo', safe)
  }, [isOpen, returnTo])

  useEffect(() => {
    if (!isOpen) {
      setView('signin'); setEmail(''); setPassword(''); setConfirm(''); setName(''); setError('')
    }
  }, [isOpen])

  if (!isOpen) return null

  function navigateAfterAuth() {
    const dest = sessionStorage.getItem('roots:returnTo')
    sessionStorage.removeItem('roots:returnTo')
    onClose()
    if (dest && typeof window !== 'undefined' && dest !== window.location.pathname) {
      router.push(dest)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    setLoading(true); setError('')
    const { error: err } = await signIn(email.trim(), password)
    setLoading(false)
    if (err) {
      setError(err.message.includes('Invalid login') ? 'Wrong email or password.' : err.message)
    } else {
      navigateAfterAuth()
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm)  { setError('Passwords don\'t match.'); return }
    setLoading(true); setError('')
    const { error: err } = await signUp(email.trim(), password, name.trim() || undefined)
    setLoading(false)
    if (err) {
      setError(err.message.includes('already registered') ? 'Account already exists — sign in instead.' : err.message)
    } else {
      // Show email confirmation screen — Supabase sends a confirm email by default
      setView('confirm-email')
    }
  }

  const handleMagicLink = async () => {
    if (!email.trim()) { setError('Enter your email first.'); return }
    setLoading(true); setError('')
    const { error: err } = await signInWithMagicLink(email.trim())
    setLoading(false)
    if (err) setError(err.message)
    else setView('magic-sent')
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) { setError('Enter your email first.'); return }
    setLoading(true); setError('')
    const { error: err } = await resetPassword(email.trim())
    setLoading(false)
    if (err) setError(err.message)
    else setView('reset-sent')
  }

  const isConfirmView  = view === 'confirm-email' || view === 'magic-sent' || view === 'reset-sent'
  const confirmHeading = view === 'confirm-email' ? 'Check your email'
    : view === 'reset-sent'  ? 'Password reset sent'
    : 'Magic link sent'
  const confirmBody    = view === 'confirm-email'
    ? `We've sent a confirmation link to ${email}. Click it to activate your account and sign in.`
    : view === 'reset-sent'
    ? `We've sent a password reset link to ${email}. Click it to choose a new password.`
    : `Sign-in link sent to ${email}. Click it to sign in — no password needed.`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-espresso/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-cream border border-sand/60 rounded-2xl p-8 w-full max-w-sm shadow-2xl shadow-espresso/15">

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 text-walnut/30 hover:text-espresso transition-colors"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Email confirmation / magic link sent */}
        {isConfirmView && (
          <div className="text-center py-2">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-6"
              style={{ background: '#252450' }}>
              <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                <rect x="1" y="1" width="18" height="14" rx="2" stroke="#F5F4F0" strokeWidth="1.5" />
                <path d="M1 4l9 6 9-6" stroke="#F5F4F0" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="font-display font-bold text-espresso text-xl mb-3">{confirmHeading}</h3>
            <p className="text-walnut/60 text-sm leading-relaxed mb-1">
              {confirmBody}
            </p>
            {view === 'confirm-email' && (
              <p className="text-xs text-walnut/40 mt-3 leading-relaxed">
                Didn't get it? Check spam, or{' '}
                <button
                  onClick={() => { setView('signup'); setPassword(''); setConfirm('') }}
                  className="underline underline-offset-2 hover:text-espresso transition-colors">
                  try again
                </button>.
              </p>
            )}
            <button
              onClick={() => setView('signin')}
              className="mt-6 text-xs text-walnut/40 hover:text-espresso transition-colors">
              Back to sign in
            </button>
          </div>
        )}

        {/* Sign in / Sign up forms */}
        {!isConfirmView && (
          <>
            <div className="flex gap-1 p-1 rounded-lg mb-6" style={{ background: 'rgba(37,36,80,0.06)' }}>
              {(['signin', 'signup'] as View[]).map(v => (
                <button
                  key={v}
                  onClick={() => { setView(v); setError(''); setPassword(''); setConfirm('') }}
                  className="flex-1 py-2 rounded-md text-xs font-bold transition-all"
                  style={view === v
                    ? { background: '#252450', color: '#F5F4F0' }
                    : { color: 'rgba(37,36,80,0.45)' }}
                >
                  {v === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            <form onSubmit={view === 'signin' ? handleSignIn : handleSignUp} className="space-y-3">
              {view === 'signup' && (
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full px-4 py-3 bg-white border border-sand rounded-xl text-sm text-espresso placeholder:text-walnut/30 focus:outline-none focus:border-walnut/30 transition-colors"
                />
              )}

              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoFocus
                required
                className="w-full px-4 py-3 bg-white border border-sand rounded-xl text-sm text-espresso placeholder:text-walnut/30 focus:outline-none focus:border-walnut/30 transition-colors"
              />

              <PasswordInput
                id="password"
                value={password}
                onChange={setPassword}
                placeholder={view === 'signup' ? 'Password (min. 8 characters)' : 'Password'}
              />

              {view === 'signup' && (
                <PasswordInput
                  id="confirm"
                  value={confirm}
                  onChange={setConfirm}
                  placeholder="Confirm password"
                />
              )}

              {error && (
                <p className="text-xs leading-snug" style={{ color: '#C8152A' }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={!email.trim() || !password || (view === 'signup' && !confirm) || loading}
                className="w-full py-3.5 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-30 text-sm"
                style={{ background: '#252450' }}
              >
                {loading ? '…' : view === 'signin' ? 'Sign in →' : 'Create account →'}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-sand/40 text-center space-y-2">
              {view === 'signin' && (
                <button
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="block w-full text-xs text-walnut/35 hover:text-walnut/60 transition-colors"
                >
                  Forgot password?
                </button>
              )}
              <button
                onClick={handleMagicLink}
                disabled={loading}
                className="block w-full text-xs text-walnut/25 hover:text-walnut/50 transition-colors"
              >
                {view === 'signin' ? 'Or sign in with a magic link' : 'Or send a magic link instead'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
