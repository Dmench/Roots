'use client'
import { useState, useEffect, useCallback } from 'react'
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

export function useProfile() {
  const [profile, setProfileState] = useState<Partial<UserProfile>>({})
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setProfileState(loadProfile())
    setHydrated(true)
  }, [])

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfileState(prev => {
      const next = { ...prev, ...updates }
      saveProfile(next)
      return next
    })
  }, [])

  const setCity = (cityId: CityId) => updateProfile({ cityId })
  const setStage = (stage: Stage) => updateProfile({ stage })
  const setArrivalDate = (date: string) => updateProfile({ arrivalDate: date })

  const toggleSituation = (tag: SituationTag) => {
    const current = profile.situations ?? []
    const next = current.includes(tag)
      ? current.filter(s => s !== tag)
      : [...current, tag]
    updateProfile({ situations: next })
  }

  const toggleTaskDone = (taskId: string) => {
    const current = profile.completedTaskIds ?? []
    const next = current.includes(taskId)
      ? current.filter(id => id !== taskId)
      : [...current, taskId]
    updateProfile({ completedTaskIds: next })
  }

  const isOnboarded = !!(profile.cityId && profile.stage)

  return {
    profile,
    hydrated,
    setCity,
    setStage,
    setArrivalDate,
    toggleSituation,
    toggleTaskDone,
    isOnboarded,
  }
}
