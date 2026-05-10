'use client'
import { useState } from 'react'
import Image from 'next/image'

interface Props {
  src:        string
  source:     string
  sourceColor: string
  aspectClass?: string   // e.g. 'aspect-[16/9]' or 'w-16 h-14'
  className?:  string
  sizes?:     string
}

export function NewsImage({
  src, source, sourceColor,
  aspectClass = 'aspect-[16/9]',
  className = '',
  sizes = '(max-width: 1024px) 100vw, 50vw',
}: Props) {
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
      className={`relative ${aspectClass} ${className} rounded-sm overflow-hidden`}
      style={{ background: 'rgba(37,36,80,0.06)' }}
    >
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        onError={() => setFailed(true)}
        className="object-cover group-hover:scale-105 transition-transform duration-500"
        unoptimized={false}
      />
    </div>
  )
}
