'use client'
import { useEffect, useState } from 'react'

// Renders the live settler count if it's a real number ≥ 25. Below that
// (pre-launch, early days), claiming a precise count looks worse than not
// showing one — so we render a soft "Early access" string instead. The
// `fallback` prop is honoured only when the API has not yet resolved.
export function LiveSettlerCount({ cityId, fallback = 0 }: { cityId: string; fallback?: number }) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/settlers/${cityId}`)
      .then(r => r.json())
      .then(d => { if (typeof d.total === 'number') setCount(d.total) })
      .catch(() => {})
  }, [cityId])

  const value = count !== null ? count : fallback
  if (value < 25) return <>Early access</>
  return <>{value}</>
}
