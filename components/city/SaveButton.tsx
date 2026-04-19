'use client'

interface SaveButtonProps {
  saved: boolean
  onToggle: () => void
  className?: string
}

export function SaveButton({ saved, onToggle, className = '' }: SaveButtonProps) {
  return (
    <button
      onClick={e => { e.preventDefault(); e.stopPropagation(); onToggle() }}
      aria-label={saved ? 'Remove from saved' : 'Save event'}
      className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-150 ${className}`}
      style={{
        background: saved ? '#4744C8' : 'rgba(37,36,80,0.08)',
        color: saved ? '#fff' : 'rgba(37,36,80,0.35)',
      }}
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 2.5C2 1.67 2.67 1 3.5 1h6c.83 0 1.5.67 1.5 1.5v10l-4.5-2.5L2 12.5V2.5z" />
      </svg>
    </button>
  )
}
