'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
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
    arrivalDate:      (data.arrival_date as string | null) ?? undefined,
    stage:            (data.stage as Stage | null) ?? undefined,
    situations:       (data.situations as SituationTag[]) ?? [],
    completedTaskIds: (data.completed_task_ids as string[]) ?? [],
    savedTaskIds:     (data.saved_task_ids as string[]) ?? [],
  }
}

export function useProfile() {
  const [profile, setProfileState] = useState<Partial<UserProfile>>({})
  const [hydrated, setHydrated]    = useState(false)

  // 1. Hydrate from localStorage
  useEffect(() => {
    setProfileState(loadProfile())
    setHydrated(true)
  }, [])

  // 2. When authenticated, pull Supabase profile (cross-device source of truth)
  useEffect(() => {
    if (!supabase || !hydrated) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data } = await supabase!
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        if (data) {
          const merged = mapSupabaseProfile(data)
          setProfileState(merged)
          saveProfile(merged)
        }
      }
      if (event === 'SIGNED_OUT') {
        // Keep local profile but clear the id so it re-syncs on next login
        setProfileState(prev => {
          const next = { ...prev, id: undefined }
          saveProfile(next)
          return next
        })
      }
    })

    // Also check current session on mount
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (data) {
        const merged = mapSupabaseProfile(data)
        setProfileState(merged)
        saveProfile(merged)
      }
    })

    return () => subscription.unsubscribe()
  }, [hydrated])

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfileState(prev => {
      const next = { ...prev, ...updates }
      saveProfile(next)

      // Fire-and-forget sync to Supabase when authenticated
      if (supabase) {
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user) return
          supabase!.from('profiles').upsert({
            id:                 user.id,
            display_name:       next.displayName      ?? null,
            city_id:            next.cityId            ?? null,
            arrival_date:       next.arrivalDate       ?? null,
            stage:              next.stage             ?? null,
            situations:         next.situations        ?? [],
            completed_task_ids: next.completedTaskIds  ?? [],
            saved_task_ids:     next.savedTaskIds      ?? [],
            updated_at:         new Date().toISOString(),
          })
        })
      }

      return next
    })
  }, [])

  const setCity          = (cityId: CityId)           => updateProfile({ cityId })
  const setStage         = (stage: Stage | undefined) => updateProfile({ stage })
  const setArrivalDate   = (date: string)             => updateProfile({ arrivalDate: date })
  const setDisplayName   = (name: string)             => updateProfile({ displayName: name })

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
    toggleSituation,
    toggleTaskDone,
    isOnboarded,
  }
}
