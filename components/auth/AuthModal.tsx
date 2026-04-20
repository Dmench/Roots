'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'

interface Props {
  isOpen:    boolean
  onClose:   () => void
  returnTo?: string
}

type View = 'signin' | 'signup' | 'magic-sent'

export function AuthModal({ isOpen, onClose, returnTo }: Props) {
  const router = useRouter()
  const { signIn, signUp, signInWithMagicLink } = useAuth()

  const [view,     setView]     = useState<View>('signin')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [name,     setName]     = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  // Store returnTo in sessionStorage so magic-link callback and password auth
  // both know where to send the user after signing in.
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return
    const dest = returnTo ?? window.location.pathname
    const safe = dest.startsWith('/auth') || dest === '/' ? '/profile' : dest
    sessionStorage.setItem('roots:returnTo', safe)
  }, [isOpen, returnTo])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setView('signin'); setEmail(''); setPassword(''); setName(''); setError('')
    }
  }, [isOpen])

  if (!isOpen) return null

  // After email/password auth, consume the returnTo and navigate there
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
    setLoading(true); setError('')
    const { error: err } = await signUp(email.trim(), password, name.trim() || undefined)
    setLoading(false)
    if (err) {
      setError(err.message.includes('already registered') ? 'Account already exists — sign in instead.' : err.message)
    } else {
      navigateAfterAuth()
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

        {view === 'magic-sent' ? (
          <div className="text-center py-2">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-6" style={{ background: '#3D3CAC' }}>
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                <path d="M1 7l5 6L17 1" stroke="#F5ECD7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="font-display font-bold text-espresso text-xl mb-2">Check your email</h3>
            <p className="text-walnut/60 text-sm leading-relaxed">
              Sign-in link sent to <strong className="text-espresso">{email}</strong>. Click it to sign in.
            </p>
            <button onClick={() => setView('signin')} className="mt-6 text-xs text-walnut/40 hover:text-espresso transition-colors">
              Back
            </button>
          </div>
        ) : (
          <>
            {/* Tab switcher */}
            <div className="flex gap-1 p-1 rounded-lg mb-6" style={{ background: 'rgba(37,36,80,0.06)' }}>
              {(['signin', 'signup'] as View[]).map(v => (
                <button
                  key={v}
                  onClick={() => { setView(v); setError('') }}
                  className="flex-1 py-2 rounded-md text-xs font-bold transition-all"
                  style={view === v
                    ? { background: '#252450', color: '#F5ECD7' }
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
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={view === 'signup' ? 'Password (min 8 characters)' : 'Password'}
                required
                className="w-full px-4 py-3 bg-white border border-sand rounded-xl text-sm text-espresso placeholder:text-walnut/30 focus:outline-none focus:border-walnut/30 transition-colors"
              />
              {error && <p className="text-xs text-red-500 leading-snug">{error}</p>}
              <button
                type="submit"
                disabled={!email.trim() || !password || loading}
                className="w-full py-3.5 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-30 text-sm"
                style={{ background: '#252450' }}
              >
                {loading ? '…' : view === 'signin' ? 'Sign in →' : 'Create account →'}
              </button>
            </form>

            {/* Magic link fallback */}
            <div className="mt-5 pt-4 border-t border-sand/40 text-center">
              <button
                onClick={handleMagicLink}
                disabled={loading}
                className="text-xs text-walnut/35 hover:text-walnut/60 transition-colors"
              >
                {view === 'signin' ? 'Forgot password? Send a magic link instead' : 'Or send a magic link instead'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
