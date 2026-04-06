'use client'
import { use, useState, useRef, useEffect } from 'react'
import { useProfile } from '@/lib/hooks/use-profile'
import { getCity, STAGES } from '@/lib/data/cities'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  relatedTasks?: string[]
}

const STARTERS: Record<string, string[]> = {
  brussels: [
    'How do I register at my commune as a non-EU citizen?',
    'Which mutuelle is best for English speakers in Brussels?',
    'How long does it take to get my eID after registering?',
    'What is a 3-6-9 lease and should I sign one?',
  ],
  lisbon: [
    'How do I get a NIF number if I arrive next month?',
    'What is NHR and do I qualify for it?',
    'How long does AIMA registration take right now?',
    'Can I rent an apartment without a Portuguese bank account?',
  ],
}

export default function AskPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: cityId } = use(params)
  const city = getCity(cityId)
  const { profile } = useProfile()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  if (!city) return null

  const stageLabel = profile.stage
    ? STAGES.find(s => s.id === profile.stage)?.label
    : null

  const starters = STARTERS[cityId] ?? STARTERS.brussels

  const send = async (text: string) => {
    const q = text.trim()
    if (!q || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          city: cityId,
          stage: profile.stage,
          situations: profile.situations ?? [],
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer ?? 'Something went wrong. Try again.',
        sources: data.sources,
        relatedTasks: data.relatedTasks,
      }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Could not reach the server. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>

      {/* Header */}
      <div className="shrink-0 px-6 md:px-10 py-6 border-b border-sand/60 bg-cream">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-espresso text-2xl leading-tight">
              Ask anything about {city.name}
            </h1>
            {stageLabel && (
              <p className="text-xs text-walnut/50 mt-1">{city.name} · {stageLabel}</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8">
        <div className="max-w-3xl mx-auto space-y-6">

          {messages.length === 0 && (
            <div>
              <p className="text-walnut text-sm mb-5">Common questions to start:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {starters.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => send(q)}
                    className="text-left bg-ivory border border-sand rounded-2xl px-5 py-4 hover:border-terracotta/30 hover:bg-white transition-all text-sm text-espresso font-medium leading-snug"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'user' ? (
                <div className="bg-espresso text-cream rounded-2xl rounded-tr-sm px-5 py-3.5 max-w-[80%]">
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              ) : (
                <div className="bg-white border border-sand rounded-2xl rounded-tl-sm px-6 py-5 max-w-[85%] space-y-4">
                  <p className="text-sm text-espresso leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                  {msg.sources && msg.sources.length > 0 && (
                    <details className="group">
                      <summary className="text-xs text-walnut/50 cursor-pointer hover:text-walnut transition-colors list-none flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="group-open:rotate-90 transition-transform">
                          <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {msg.sources.length} source{msg.sources.length > 1 ? 's' : ''}
                      </summary>
                      <div className="mt-2 space-y-1 pl-4">
                        {msg.sources.map((url, j) => (
                          <a
                            key={j}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-sky hover:underline truncate"
                          >
                            {url}
                          </a>
                        ))}
                      </div>
                    </details>
                  )}

                  {msg.relatedTasks && msg.relatedTasks.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-sand/60">
                      <span className="text-xs text-walnut/40 self-center">Related tasks:</span>
                      {msg.relatedTasks.map((slug, j) => (
                        <a
                          key={j}
                          href={`/${cityId}/settle`}
                          className="text-xs px-3 py-1 bg-terracotta-light text-terracotta-dark rounded-full hover:bg-terracotta hover:text-cream transition-colors"
                        >
                          {slug.replace(/-/g, ' ')}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-sand rounded-2xl rounded-tl-sm px-6 py-4">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-2 h-2 bg-walnut/30 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-sand/60 bg-cream/95 backdrop-blur-sm px-6 md:px-10 py-5">
        <div className="max-w-3xl mx-auto flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask anything about living in ${city.name}…`}
            rows={1}
            className="flex-1 resize-none bg-ivory border border-sand rounded-2xl px-5 py-3.5 text-sm text-espresso placeholder:text-walnut/40 focus:outline-none focus:border-terracotta/50 transition-colors leading-relaxed"
            style={{ maxHeight: 160, overflowY: 'auto' }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="shrink-0 w-11 h-11 bg-terracotta text-cream rounded-full flex items-center justify-center hover:bg-terracotta-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8h12M10 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <p className="text-center text-xs text-walnut/30 mt-3">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
