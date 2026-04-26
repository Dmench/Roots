'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import type { CityId, Stage, SituationTag, UserProfile } from '@/lib/types'

const STORAGE_KEY = 'roots-profile'

function loadProfile(): Partial<UserProfile> {
  if (typeof window === 'undefined') return {}
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch { return {} }
}

function saveProfile(profile: Partial<UserProfile>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)) } catch {}
}

function mapSupabaseProfile(data: Record<string, unknown>): Partial<UserProfile> {
  return {
    id:               data.id as string,
    displayName:      (data.display_name as string | null) ?? undefined,
    cityId:           (data.city_id as string | null) as CityId | undefined,
    neighborhood:     (data.neighborhood as string | null) ?? undefined,
    languages:        (data.languages as string[]) ?? [],
    arrivalDate:      (data.arrival_date as string | null) ?? undefined,
    stage:            (data.stage as Stage | null) ?? undefined,
    situations:       (data.situations as SituationTag[]) ?? [],
    completedTaskIds: (data.completed_task_ids as string[]) ?? [],
    savedTaskIds:     (data.saved_task_ids as string[]) ?? [],
    showInDirectory:  (data.show_in_directory as boolean | null) ?? true,
  }
}

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfileState] = useState<Partial<UserProfile>>({})
  const [hydrated, setHydrated]    = useState(false)

  // 1. Hydrate from localStorage immediately (no network, no flash)
  useEffect(() => {
    setProfileState(loadProfile())
    setHydrated(true)
  }, [])

  // 2. Sync with Supabase whenever auth state changes
  useEffect(() => {
    if (!supabase || !hydrated) return

    if (!user) {
      // Signed out — clear in-memory state but KEEP localStorage so data
      // restores automatically when the same user signs back in.
      setProfileState({})
      return
    }

    // Different user signed in on same device — clear stale local data first
    const localId = loadProfile().id
    if (localId && localId !== user.id) {
      saveProfile({})
      setProfileState({})
    }

    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error && error.code !== 'PGRST116') {
          // PGRST116 = no rows found (new user) — not an error
          console.error('[profile] fetch error:', error.message)
        }

        if (data) {
          const db = mapSupabaseProfile(data)
          setProfileState(prev => {
            // DB is source of truth for any field it has a value for.
            // Local data fills gaps (e.g. fields set before first save).
            const merged: Partial<UserProfile> = {
              ...prev,
              id: user.id,
              ...(db.displayName              && { displayName:      db.displayName }),
              ...(db.cityId                   && { cityId:           db.cityId }),
              ...(db.stage                    && { stage:            db.stage }),
              ...(db.neighborhood             && { neighborhood:     db.neighborhood }),
              ...(db.arrivalDate              && { arrivalDate:      db.arrivalDate }),
              ...(db.languages?.length        && { languages:        db.languages }),
              ...(db.situations?.length       && { situations:       db.situations }),
              ...(db.completedTaskIds?.length && { completedTaskIds: db.completedTaskIds }),
              showInDirectory: db.showInDirectory ?? prev.showInDirectory ?? true,
            }
            saveProfile(merged)
            return merged
          })
        } else {
          // New user — no DB row yet. Keep any local data, stamp with user.id
          setProfileState(prev => {
            const next = { ...prev, id: user.id }
            saveProfile(next)
            return next
          })
        }
      })
  }, [user, hydrated])

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfileState(prev => {
      const next = { ...prev, ...updates }
      saveProfile(next)

      const uid = user?.id
      if (supabase && uid) {
        supabase.from('profiles').upsert({
          id:                 uid,
          display_name:       next.displayName      ?? null,
          city_id:            next.cityId           ?? null,
          neighborhood:       next.neighborhood     ?? null,
          languages:          next.languages        ?? [],
          arrival_date:       next.arrivalDate      ?? null,
          stage:              next.stage            ?? null,
          situations:         next.situations       ?? [],
          completed_task_ids: next.completedTaskIds ?? [],
          saved_task_ids:     next.savedTaskIds     ?? [],
          show_in_directory:  next.showInDirectory  ?? true,
          updated_at:         new Date().toISOString(),
        }).then(({ error }) => {
          if (error) console.error('[profile] upsert failed:', error.message)
        })
      }

      return next
    })
  }, [user])

  const setCity            = (cityId: CityId)           => updateProfile({ cityId })
  const setStage           = (stage: Stage | undefined) => updateProfile({ stage })
  const setArrivalDate     = (date: string)             => updateProfile({ arrivalDate: date })
  const setDisplayName     = (name: string)             => updateProfile({ displayName: name })
  const setNeighborhood    = (n: string | undefined)    => updateProfile({ neighborhood: n })
  const setShowInDirectory = (val: boolean)             => updateProfile({ showInDirectory: val })

  const toggleLanguage = (code: string) => {
    const current = profile.languages ?? []
    updateProfile({
      languages: current.includes(code)
        ? current.filter(l => l !== code)
        : [...current, code],
    })
  }

  const toggleSituation = (tag: SituationTag) => {
    const current = profile.situations ?? []
    updateProfile({
      situations: current.includes(tag)
        ? current.filter(s => s !== tag)
        : [...current, tag],
    })
  }

  const toggleTaskDone = (taskId: string) => {
    const current = profile.completedTaskIds ?? []
    updateProfile({
      completedTaskIds: current.includes(taskId)
        ? current.filter(id => id !== taskId)
        : [...current, taskId],
    })
  }

  const isOnboarded = !!(profile.cityId && profile.stage)

  return {
    profile,
    hydrated,
    setCity,
    setStage,
    setArrivalDate,
    setDisplayName,
    setNeighborhood,
    setShowInDirectory,
    toggleLanguage,
    toggleSituation,
    toggleTaskDone,
    isOnboarded,
    updateProfile,
  }
}
