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
  const { user } = useAuth()  // from shared context — always current, no race condition
  const [profile, setProfileState] = useState<Partial<UserProfile>>({})
  const [hydrated, setHydrated]    = useState(false)

  // 1. Hydrate from localStorage immediately
  useEffect(() => {
    setProfileState(loadProfile())
    setHydrated(true)
  }, [])

  // 2. When auth state changes, sync from Supabase.
  //    DB values win for fields that are set; local wins on null/empty DB fields.
  useEffect(() => {
    if (!supabase || !hydrated) return

    if (!user) {
      saveProfile({})
      setProfileState({})
      return
    }

    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) {
          const db = mapSupabaseProfile(data)
          setProfileState(prev => {
            const merged: Partial<UserProfile> = { ...prev, id: user.id }
            if (db.cityId)                   merged.cityId            = db.cityId
            if (db.stage)                    merged.stage             = db.stage
            if (db.displayName)              merged.displayName       = db.displayName
            if (db.neighborhood)             merged.neighborhood      = db.neighborhood
            if (db.arrivalDate)              merged.arrivalDate       = db.arrivalDate
            if (db.languages?.length)        merged.languages         = db.languages
            if (db.situations?.length)       merged.situations        = db.situations
            if (db.completedTaskIds?.length) merged.completedTaskIds  = db.completedTaskIds
            merged.showInDirectory = db.showInDirectory ?? prev.showInDirectory ?? true
            saveProfile(merged)
            return merged
          })
        } else {
          // Brand-new user — no DB row yet
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
          city_id:            next.cityId            ?? null,
          neighborhood:       next.neighborhood      ?? null,
          languages:          next.languages         ?? [],
          arrival_date:       next.arrivalDate       ?? null,
          stage:              next.stage             ?? null,
          situations:         next.situations        ?? [],
          completed_task_ids: next.completedTaskIds  ?? [],
          saved_task_ids:     next.savedTaskIds      ?? [],
          show_in_directory:  next.showInDirectory   ?? true,
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
