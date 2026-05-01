'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'

export function useFollow(targetUserId: string) {
  const { user } = useAuth()
  const [following,       setFollowing]       = useState(false)
  const [followerCount,   setFollowerCount]   = useState(0)
  const [followingCount,  setFollowingCount]  = useState(0)
  const [loading,         setLoading]         = useState(true)

  useEffect(() => {
    if (!supabase || !targetUserId) { setLoading(false); return }
    const sb = supabase

    // Fetch follower count for target
    const fetchCounts = async () => {
      const [{ count: fc }, { count: fgc }] = await Promise.all([
        sb.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', targetUserId),
        sb.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id',  targetUserId),
      ])
      setFollowerCount(fc ?? 0)
      setFollowingCount(fgc ?? 0)
    }

    const checkFollowing = async () => {
      if (!user) { setFollowing(false); return }
      const { data } = await sb
        .from('follows')
        .select('follower_id')
        .eq('follower_id',  user.id)
        .eq('following_id', targetUserId)
        .maybeSingle()
      setFollowing(!!data)
    }

    Promise.all([fetchCounts(), checkFollowing()]).finally(() => setLoading(false))
  }, [user, targetUserId])

  const toggle = useCallback(async () => {
    if (!supabase || !user || !targetUserId || user.id === targetUserId) return

    if (following) {
      setFollowing(false)
      setFollowerCount(c => Math.max(0, c - 1))
      await supabase.from('follows').delete()
        .eq('follower_id',  user.id)
        .eq('following_id', targetUserId)
    } else {
      setFollowing(true)
      setFollowerCount(c => c + 1)
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUserId })
    }
  }, [user, targetUserId, following])

  return { following, followerCount, followingCount, loading, toggle }
}
