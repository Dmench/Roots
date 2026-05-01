'use client'
import { useEffect, useState } from 'react'

export function LiveSettlerCount({ cityId, fallback = 0 }: { cityId: string; fallback?: number }) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/settlers/${cityId}`)
      .then(r => r.json())
      .then(d => { if (typeof d.total === 'number') setCount(d.total) })
      .catch(() => {})
  }, [cityId])

  return <>{count !== null ? count : fallback}</>
}
