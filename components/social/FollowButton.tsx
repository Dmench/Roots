'use client'
import { useState } from 'react'
import { useFollow } from '@/lib/hooks/use-follow'
import { useAuth } from '@/lib/hooks/use-auth'

interface Props {
  targetUserId: string
  targetName?:  string
  size?:        'sm' | 'md'
}

export function FollowButton({ targetUserId, targetName, size = 'sm' }: Props) {
  const { user }                                          = useAuth()
  const { following, followerCount, loading, toggle }    = useFollow(targetUserId)
  const [showAuthHint, setShowAuthHint]                  = useState(false)

  if (!user && user === null && typeof window !== 'undefined') {
    // not logged in — show a ghost button that prompts sign-in
  }

  if (loading) return null
  // Don't show follow button for own profile
  if (user?.id === targetUserId) return null

  const handleClick = () => {
    if (!user) { setShowAuthHint(true); setTimeout(() => setShowAuthHint(false), 2500); return }
    toggle()
  }

  const pad   = size === 'sm' ? 'px-3 py-1'    : 'px-5 py-2'
  const text  = size === 'sm' ? 'text-[11px]'  : 'text-xs'

  return (
    <div className="relative inline-block">
      <button
        onClick={handleClick}
        className={`${pad} ${text} font-bold tracking-wide transition-all duration-150 active:scale-95`}
        style={following ? {
          background: 'transparent',
          color:      'rgba(10,10,10,0.4)',
          border:     '1.5px solid rgba(10,10,10,0.15)',
        } : {
          background: '#252450',
          color:      '#fff',
          border:     '1.5px solid #252450',
        }}
      >
        {following ? 'Following' : 'Follow'}
      </button>
      {showAuthHint && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap
          px-3 py-1.5 text-[10px] font-bold text-white bg-[#0A0A0A] pointer-events-none"
          style={{ animation: 'fadeUp 0.2s ease' }}>
          Sign in to follow{targetName ? ` ${targetName}` : ''}
        </div>
      )}
    </div>
  )
}
