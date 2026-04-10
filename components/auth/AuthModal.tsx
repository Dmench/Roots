'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: Props) {
  const { signIn }  = useAuth()
  const [email, setEmail]     = useState('')
  const [sent,  setSent]      = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error: err } = await signIn(email.trim())
    setLoading(false)
    if (err) setError(err.message)
    else setSent(true)
  }

  const handleClose = () => {
    setSent(false)
    setEmail('')
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-espresso/30 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-cream border border-sand/60 rounded-sm p-8 w-full max-w-sm shadow-2xl shadow-espresso/15">

        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-1 text-walnut/30 hover:text-espresso transition-colors"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {sent ? (
          <div className="text-center py-2">
            <div
              className="w-12 h-12 rounded-sm flex items-center justify-center mx-auto mb-6"
              style={{ background: '#3D3CAC' }}
            >
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                <path d="M1 7l5 6L17 1" stroke="#C8903A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="font-display font-bold text-espresso text-xl mb-2">Check your email</h3>
            <p className="text-walnut/60 text-sm leading-relaxed">
              Sign-in link sent to <strong className="text-espresso">{email}</strong>. Click it — no password needed.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs uppercase tracking-[0.2em] text-walnut/40 mb-3">Sign in</p>
            <h3 className="font-display font-bold text-espresso text-2xl mb-2 leading-tight">
              Save your progress
            </h3>
            <p className="text-walnut/60 text-sm mb-7 leading-relaxed">
              Sync tasks and posts across devices. No password needed — just your email.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoFocus
                className="w-full px-4 py-3 bg-ivory border border-sand rounded-sm text-sm text-espresso placeholder:text-walnut/30 focus:outline-none focus:border-terracotta/40 transition-colors"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={!email.trim() || loading}
                className="w-full py-3.5 text-cream rounded-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-30 text-sm"
                style={{ background: '#3D3CAC' }}
              >
                {loading ? 'Sending…' : 'Send sign-in link →'}
              </button>
            </form>
            <p className="text-center text-xs text-walnut/30 mt-5">No password. No spam. One click.</p>
          </>
        )}
      </div>
    </div>
  )
}
