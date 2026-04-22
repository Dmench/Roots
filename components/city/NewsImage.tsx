'use client'
import { useState } from 'react'

interface Props {
  src:        string
  source:     string
  sourceColor: string
  aspectClass?: string   // e.g. 'aspect-[16/9]' or 'w-16 h-14'
  className?:  string
}

export function NewsImage({ src, source, sourceColor, aspectClass = 'aspect-[16/9]', className = '' }: Props) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        className={`${aspectClass} ${className} rounded-sm flex items-end p-3`}
        style={{
          background: `linear-gradient(135deg, ${sourceColor}20, ${sourceColor}06)`,
          border: `1px solid ${sourceColor}18`,
        }}
      >
        <span className="text-[8px] font-black tracking-widest uppercase" style={{ color: sourceColor }}>
          {source}
        </span>
      </div>
    )
  }

  return (
    <div
      className={`${aspectClass} ${className} rounded-sm overflow-hidden`}
      style={{ background: 'rgba(37,36,80,0.06)' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
    </div>
  )
}
