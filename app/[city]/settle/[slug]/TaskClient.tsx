'use client'
import { useProfile } from '@/lib/hooks/use-profile'
import { useAuth } from '@/lib/hooks/use-auth'
import Link from 'next/link'

export function TaskClient({ taskId, cityId }: { taskId: string; cityId: string }) {
  const { user } = useAuth()
  const { profile, toggleTaskDone } = useProfile()

  if (!user) {
    return (
      <Link href={`/${cityId}/settle`}
        className="inline-flex items-center gap-2 px-5 py-3 text-[10px] font-black tracking-[0.18em] uppercase text-white hover:opacity-85 transition-opacity"
        style={{ background: '#0A0A0A' }}>
        Sign in to track progress →
      </Link>
    )
  }

  const done = (profile.completedTaskIds ?? []).includes(taskId)

  return (
    <button
      onClick={() => toggleTaskDone(taskId)}
      className="flex items-center gap-3 px-5 py-3 transition-all hover:opacity-80"
      style={{
        background: done ? 'rgba(16,185,129,0.08)' : '#0A0A0A',
        border: done ? '1.5px solid rgba(16,185,129,0.3)' : 'none',
        color: done ? '#0E9B6B' : '#FFFFFF',
      }}
    >
      <span className="w-4 h-4 flex items-center justify-center shrink-0"
        style={{
          border: done ? '1.5px solid #0E9B6B' : '1.5px solid rgba(255,255,255,0.4)',
          background: done ? '#0E9B6B' : 'transparent',
        }}>
        {done && (
          <svg width="8" height="6" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="text-[10px] font-black tracking-[0.18em] uppercase">
        {done ? 'Marked as done' : 'Mark as done'}
      </span>
    </button>
  )
}
