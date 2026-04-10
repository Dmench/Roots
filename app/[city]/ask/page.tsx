'use client'
import { use, useState, useRef, useEffect } from 'react'
import { useProfile } from '@/lib/hooks/use-profile'
import { useAuth } from '@/lib/hooks/use-auth'
import { AuthModal } from '@/components/auth/AuthModal'
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
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  if (!city) return null

  const stageLabel = profile.stage ? STAGES.find(s => s.id === profile.stage)?.label : null
  const starters   = STARTERS[cityId] ?? STARTERS.brussels

  const send = async (text: string) => {
    const q = text.trim()
    if (!q || loading) return
    if (!user) { setAuthOpen(true); return }
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, city: cityId, stage: profile.stage, situations: profile.situations ?? [] }),
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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>

      {/* Header */}
      <div className="shrink-0 px-6 md:px-10 py-5 border-b border-sand/40 bg-white">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display font-bold text-espresso text-xl leading-tight">
            Ask anything about {city.name}
          </h1>
          {stageLabel && (
            <p className="text-xs text-stone mt-0.5">{city.name} · {stageLabel}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8 bg-cream">
        <div className="max-w-3xl mx-auto space-y-6">

          {messages.length === 0 && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone mb-5 font-medium">Common questions</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {starters.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => send(q)}
                    className="text-left bg-white rounded-xl border border-sand/50 px-5 py-4 hover:border-sky/50 hover:shadow-md hover:shadow-espresso/4 transition-all text-sm text-walnut/70 hover:text-espresso leading-snug"
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
                <div className="rounded-2xl rounded-tr-sm px-5 py-3.5 max-w-[80%]" style={{ background: '#3D3CAC' }}>
                  <p className="text-sm leading-relaxed text-white font-medium">{msg.content}</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl rounded-tl-sm border border-sand/50 px-6 py-5 max-w-[88%] space-y-4 shadow-sm">
                  <p className="text-sm text-walnut/80 leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                  {msg.sources && msg.sources.length > 0 && (
                    <details className="group">
                      <summary className="text-xs text-stone cursor-pointer hover:text-walnut transition-colors list-none flex items-center gap-1.5">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="group-open:rotate-90 transition-transform">
                          <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {msg.sources.length} source{msg.sources.length > 1 ? 's' : ''}
                      </summary>
                      <div className="mt-2 space-y-1 pl-4">
                        {msg.sources.map((url, j) => (
                          <a key={j} href={url} target="_blank" rel="noopener noreferrer"
                            className="block text-xs truncate hover:underline" style={{ color: '#00BAFF' }}>
                            {url}
                          </a>
                        ))}
                      </div>
                    </details>
                  )}

                  {msg.relatedTasks && msg.relatedTasks.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-sand/40">
                      <span className="text-xs text-stone self-center">Related tasks:</span>
                      {msg.relatedTasks.map((slug, j) => (
                        <a key={j} href={`/${cityId}/settle`}
                          className="text-xs px-3 py-1 rounded-lg border font-medium hover:opacity-80 transition-opacity"
                          style={{ borderColor: '#FDB833', color: '#E5A21F', background: '#FFF5D6' }}
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
              <div className="bg-white rounded-2xl rounded-tl-sm border border-sand/50 px-6 py-4 shadow-sm">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-2 h-2 rounded-full animate-bounce"
                      style={{ background: '#3D3CAC', opacity: 0.4, animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-sand/40 px-6 md:px-10 py-4 bg-white">
        {user ? (
          <>
            <div className="max-w-3xl mx-auto flex gap-3 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask anything about living in ${city.name}…`}
                rows={1}
                className="flex-1 resize-none border border-sand rounded-xl px-5 py-3.5 text-sm text-espresso placeholder:text-stone/60 focus:outline-none focus:border-terracotta/40 transition-colors leading-relaxed bg-ivory"
                style={{ maxHeight: 160, overflowY: 'auto' }}
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-30"
                style={{ background: '#3D3CAC' }}
                aria-label="Send"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8h12M10 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <p className="text-center text-xs text-stone mt-2">Enter to send · Shift+Enter for new line</p>
          </>
        ) : (
          <div className="max-w-3xl mx-auto text-center py-2">
            <p className="text-sm text-stone mb-3">Sign in to ask questions about {city.name}</p>
            <button
              onClick={() => setAuthOpen(true)}
              className="px-6 py-2.5 text-sm font-semibold text-white rounded-full hover:opacity-90 transition-opacity"
              style={{ background: '#3D3CAC' }}
            >
              Sign in →
            </button>
          </div>
        )}
      </div>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  )
}
