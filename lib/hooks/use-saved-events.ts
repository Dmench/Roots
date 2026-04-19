'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import type { SerializableEvent } from '@/components/city/EventsSection'

async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

export function useSavedEvents(cityId: string) {
  const { user } = useAuth()
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    if (!user) { setSavedIds(new Set()); return }
    setLoading(true)
    getAccessToken().then(token => {
      if (!token) { setLoading(false); return }
      fetch(`/api/events/save?cityId=${cityId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(({ savedIds: ids }) => { setSavedIds(new Set(ids ?? [])) })
        .catch(() => {})
        .finally(() => setLoading(false))
    })
  }, [user, cityId])

  const toggle = useCallback(async (event: SerializableEvent) => {
    const token = await getAccessToken()
    if (!token) {
      // Signal to open auth modal
      window.dispatchEvent(new CustomEvent('roots:open-auth'))
      return
    }

    const isSaved = savedIds.has(event.id)
    // Optimistic update
    setSavedIds(prev => {
      const next = new Set(prev)
      if (isSaved) next.delete(event.id)
      else next.add(event.id)
      return next
    })

    const res = await fetch('/api/events/save', {
      method: isSaved ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(isSaved ? { eventId: event.id } : { event, cityId }),
    })

    if (!res.ok) {
      // Revert on failure
      setSavedIds(prev => {
        const next = new Set(prev)
        if (isSaved) next.add(event.id)
        else next.delete(event.id)
        return next
      })
    }
  }, [savedIds, cityId])

  return { savedIds, loading, toggle }
}
