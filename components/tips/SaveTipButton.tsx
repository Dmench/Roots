'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { useProfile } from '@/lib/hooks/use-profile'
import { AuthModal } from '@/components/auth/AuthModal'

interface Props {
  /** Stable slug of the tip — what gets stored in profile.savedTipSlugs */
  slug:  string
  /** Title used in the toast confirmation */
  title: string
}

// SaveTipButton — toggles a tip in/out of the user's personal saved set.
// Anonymous users get an auth prompt; the slug is added optimistically
// and synced via useProfile().updateProfile.
export function SaveTipButton({ slug, title: _title }: Props) {
  const { user } = useAuth()
  const { profile, toggleSavedTip } = useProfile()
  const [authOpen, setAuthOpen] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const isSaved = (profile.savedTipSlugs ?? []).includes(slug)

  function onClick() {
    if (!user) { setAuthOpen(true); return }
    toggleSavedTip(slug)
    if (!isSaved) {
      setJustSaved(true)
      window.setTimeout(() => setJustSaved(false), 2400)
    }
  }

  return (
    <>
      <button
        onClick={onClick}
        className="inline-flex items-center gap-2 px-3 py-2 text-[10px] font-black tracking-[0.18em] uppercase transition-all"
        style={{
          background: isSaved ? '#0E9B6B' : '#FFFFFF',
          color: isSaved ? '#FFFFFF' : '#0A0A0A',
          border: `1px solid ${isSaved ? '#0E9B6B' : 'rgba(10,10,10,0.12)'}`,
        }}>
        {justSaved ? '✓ Saved' : isSaved ? '✓ Saved' : '+ Save'}
      </button>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  )
}
