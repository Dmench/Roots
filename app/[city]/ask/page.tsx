'use client'
import { use, useState, useRef, useEffect } from 'react'
import { useProfile } from '@/lib/hooks/use-profile'
import { useAuth } from '@/lib/hooks/use-auth'
import { AuthModal } from '@/components/auth/AuthModal'
import AuthGate from '@/components/auth/AuthGate'
import { getCity, STAGES } from '@/lib/data/cities'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  relatedTasks?: string[]
}

/* ── Starter questions grouped by theme ─────────────────────────────────── */

const STARTERS: Record<string, { label: string; color: string; questions: string[] }[]> = {
  brussels: [
    {
      label: 'Admin & Registration',
      color: '#4744C8',
      questions: [
        'How do I register at my commune as a non-EU citizen?',
        'How long does the eID card take after commune registration?',
        'What documents do I need to open a Belgian bank account?',
      ],
    },
    {
      label: 'Healthcare',
      color: '#FF3EBA',
      questions: [
        'Which mutuelle is best for English speakers in Brussels?',
        'How do I register with a GP (médecin généraliste)?',
        'What does Belgian health insurance actually cover?',
      ],
    },
    {
      label: 'Housing & Leases',
      color: '#FAB400',
      questions: [
        'What is a 3-6-9 lease and should I sign one?',
        'What are my rights if my landlord refuses to return my deposit?',
        'How much is the typical rental guarantee in Brussels?',
      ],
    },
    {
      label: 'Daily Life',
      color: '#10B981',
      questions: [
        'What is STIB and how does the monthly pass work?',
        'Which neighbourhoods are best for English speakers?',
        'How does the Belgian schooling system work for expat children?',
      ],
    },
  ],
  lisbon: [
    {
      label: 'Admin & Visas',
      color: '#4744C8',
      questions: [
        'How do I get a NIF number if I arrive next month?',
        'How long does AIMA registration take right now?',
        'Can I rent an apartment without a Portuguese bank account?',
      ],
    },
    {
      label: 'Tax & Finance',
      color: '#FAB400',
      questions: [
        'What is NHR and do I qualify for it?',
        'How does the Portuguese freelancer tax regime work?',
        'When do I need to file my first Portuguese tax return?',
      ],
    },
    {
      label: 'Housing',
      color: '#10B981',
      questions: [
        'What are typical tenant rights in Portugal?',
        'What documents do landlords require in Lisbon?',
        'How does the rental deposit work in Portugal?',
      ],
    },
    {
      label: 'Daily Life',
      color: '#FF3EBA',
      questions: [
        'How does the healthcare system work for residents?',
        'What is the best neighbourhood in Lisbon for families?',
        'How do I get a Portuguese driver\'s licence exchange done?',
      ],
    },
  ],
}

/* ── Simple markdown renderer ───────────────────────────────────────────── */

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []
  let listItems: string[] = []
  let listType: 'ul' | 'ol' | null = null

  const flushList = (key: string) => {
    if (listItems.length === 0) return
    if (listType === 'ul') {
      nodes.push(
        <ul key={key} className="space-y-1 my-2 pl-4">
          {listItems.map((item, i) => (
            <li key={i} className="text-sm leading-relaxed list-disc" style={{ color: 'rgba(37,36,80,0.75)' }}
              dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
          ))}
        </ul>
      )
    } else {
      nodes.push(
        <ol key={key} className="space-y-1 my-2 pl-4">
          {listItems.map((item, i) => (
            <li key={i} className="text-sm leading-relaxed list-decimal" style={{ color: 'rgba(37,36,80,0.75)' }}
              dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
          ))}
        </ol>
      )
    }
    listItems = []
    listType = null
  }

  lines.forEach((line, i) => {
    const ulMatch = line.match(/^[-*]\s+(.+)/)
    const olMatch = line.match(/^\d+\.\s+(.+)/)

    if (ulMatch) {
      if (listType === 'ol') flushList(`list-${i}`)
      listType = 'ul'
      listItems.push(ulMatch[1])
    } else if (olMatch) {
      if (listType === 'ul') flushList(`list-${i}`)
      listType = 'ol'
      listItems.push(olMatch[1])
    } else {
      flushList(`list-${i}`)
      if (line.trim() === '') {
        nodes.push(<div key={`gap-${i}`} className="h-2" />)
      } else if (line.startsWith('### ')) {
        nodes.push(
          <p key={i} className="text-xs font-black uppercase tracking-wider mt-3 mb-1"
            style={{ color: 'rgba(37,36,80,0.45)' }}>
            {line.slice(4)}
          </p>
        )
      } else if (line.startsWith('## ')) {
        nodes.push(
          <p key={i} className="text-sm font-bold mt-3 mb-1" style={{ color: '#252450' }}>
            {line.slice(3)}
          </p>
        )
      } else {
        nodes.push(
          <p key={i} className="text-sm leading-relaxed" style={{ color: 'rgba(37,36,80,0.75)' }}
            dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />
        )
      }
    }
  })
  flushList('list-end')
  return nodes
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#252450;font-weight:700">$1</strong>')
    .replace(/`(.+?)`/g, '<code style="background:rgba(37,36,80,0.07);padding:1px 5px;border-radius:4px;font-size:12px">$1</code>')
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function AskPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: cityId } = use(params)
  const city    = getCity(cityId)
  const { profile } = useProfile()
  const { user, loading: authLoading } = useAuth()

  const [messages,  setMessages]  = useState<Message[]>([])
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [authOpen,  setAuthOpen]  = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  if (!city) return null
  if (authLoading) return <div className="min-h-screen bg-cream" />
  if (!user) return <AuthGate cityName={city.name} cityId={cityId}>{null}</AuthGate>

  const stageLabel  = profile.stage ? STAGES.find(s => s.id === profile.stage)?.label : null
  const starterGroups = STARTERS[cityId] ?? STARTERS.brussels

  const send = async (text: string) => {
    const q = text.trim()
    if (!q || loading) return
    if (!user) { setAuthOpen(true); return }
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)
    try {
      const res  = await fetch('/api/ask', {
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

  const hasMessages = messages.length > 0

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px)', background: '#F8F7F4' }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-6 md:px-10 py-5 bg-white"
        style={{ borderBottom: '1px solid rgba(37,36,80,0.08)' }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-espresso text-lg leading-tight">
              {city.name} Intelligence
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(37,36,80,0.4)' }}>
              Practical answers about living in {city.name}
              {stageLabel && <span> · {stageLabel}</span>}
            </p>
          </div>
          {/* Trust signal */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(71,68,200,0.06)', border: '1px solid rgba(71,68,200,0.12)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#4744C8' }} />
            <span className="text-[10px] font-bold tracking-wide" style={{ color: '#4744C8' }}>
              POWERED BY CLAUDE
            </span>
          </div>
        </div>
      </div>

      {/* ── Conversation area ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* ── Empty state ──────────────────────────────────────────────── */}
          {!hasMessages && (
            <div>
              {/* Intro */}
              <div className="mb-8 p-6 rounded-2xl"
                style={{ background: 'linear-gradient(135deg, rgba(71,68,200,0.06) 0%, rgba(71,68,200,0.02) 100%)', border: '1px solid rgba(71,68,200,0.1)' }}>
                <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-2" style={{ color: '#4744C8' }}>
                  What Roots knows about {city.name}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(37,36,80,0.65)' }}>
                  Ask anything about admin, housing, healthcare, transport, or daily life — and get answers grounded in how {city.name} actually works. Not generic expat advice. Specific, practical, current.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {['Commune registration', 'Healthcare system', 'Lease contracts', 'Tax & banking', 'Transport'].map(tag => (
                    <span key={tag} className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(71,68,200,0.08)', color: '#4744C8' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Question groups */}
              <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {starterGroups.map((group, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTab(i)}
                    className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                    style={activeTab === i
                      ? { background: group.color, color: '#fff' }
                      : { background: `${group.color}12`, color: group.color }
                    }
                  >
                    {group.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {starterGroups[activeTab].questions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => send(q)}
                    className="text-left bg-white rounded-xl px-4 py-4 hover:shadow-md transition-all group"
                    style={{ border: '1px solid rgba(37,36,80,0.08)' }}
                  >
                    <p className="text-xs font-medium leading-snug group-hover:opacity-70 transition-opacity"
                      style={{ color: '#252450' }}>
                      {q}
                    </p>
                    <p className="text-[9px] mt-2 font-bold tracking-wide"
                      style={{ color: starterGroups[activeTab].color }}>
                      ASK →
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Messages ─────────────────────────────────────────────────── */}
          {messages.map((msg, i) => (
            <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'user' ? (
                <div className="rounded-2xl rounded-tr-sm px-5 py-3.5 max-w-[80%]"
                  style={{ background: '#252450' }}>
                  <p className="text-sm leading-relaxed text-white font-medium">{msg.content}</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl rounded-tl-sm px-6 py-5 max-w-[90%] shadow-sm"
                  style={{ border: '1px solid rgba(37,36,80,0.08)' }}>

                  {/* Rendered answer */}
                  <div className="space-y-1">
                    {renderMarkdown(msg.content)}
                  </div>

                  {/* Sources — visible by default */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(37,36,80,0.07)' }}>
                      <p className="text-[9px] font-black uppercase tracking-widest mb-2"
                        style={{ color: 'rgba(37,36,80,0.3)' }}>
                        Sources
                      </p>
                      <div className="space-y-1">
                        {msg.sources.map((url, j) => {
                          let host = url
                          try { host = new URL(url).hostname.replace('www.', '') } catch { /* keep raw */ }
                          return (
                            <a key={j} href={url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-2 group hover:opacity-70 transition-opacity">
                              <span className="w-1 h-1 rounded-full shrink-0" style={{ background: '#4744C8' }} />
                              <span className="text-xs truncate" style={{ color: '#4744C8' }}>{host}</span>
                            </a>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Related tasks */}
                  {msg.relatedTasks && msg.relatedTasks.length > 0 && (
                    <div className="mt-4 pt-4 flex flex-wrap gap-2"
                      style={{ borderTop: '1px solid rgba(37,36,80,0.07)' }}>
                      <span className="text-[9px] font-black uppercase tracking-widest self-center"
                        style={{ color: 'rgba(37,36,80,0.3)' }}>
                        Related tasks
                      </span>
                      {msg.relatedTasks.map((slug, j) => (
                        <a key={j} href={`/${cityId}/settle`}
                          className="text-xs px-3 py-1 rounded-full font-bold hover:opacity-80 transition-opacity"
                          style={{ background: '#FAB40018', color: '#D49800', border: '1px solid #FAB40030' }}>
                          {slug.replace(/-/g, ' ')}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Loading */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm"
                style={{ border: '1px solid rgba(37,36,80,0.08)' }}>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ background: '#4744C8', opacity: 0.5, animationDelay: `${i * 0.12}s` }} />
                    ))}
                  </div>
                  <span className="text-xs" style={{ color: 'rgba(37,36,80,0.35)' }}>
                    Looking into this…
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input bar ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 bg-white px-6 md:px-10 py-4"
        style={{ borderTop: '1px solid rgba(37,36,80,0.08)' }}>
        {user ? (
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask anything about ${city.name}…`}
                rows={1}
                className="flex-1 resize-none rounded-xl px-5 py-3.5 text-sm focus:outline-none leading-relaxed"
                style={{
                  maxHeight: 160,
                  overflowY: 'auto',
                  background: '#F8F7F4',
                  border: '1px solid rgba(37,36,80,0.12)',
                  color: '#252450',
                }}
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-25"
                style={{ background: '#252450' }}
                aria-label="Send"
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M2 7.5h11M9 3.5l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-center mt-2" style={{ color: 'rgba(37,36,80,0.25)' }}>
              Enter to send · Shift+Enter for new line · Answers may not be current — verify official sources
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between gap-4 px-5 py-3.5 rounded-xl"
              style={{ background: '#F8F7F4', border: '1px solid rgba(37,36,80,0.1)' }}>
              <p className="text-sm" style={{ color: 'rgba(37,36,80,0.5)' }}>
                Sign in to ask questions about {city.name}
              </p>
              <button
                onClick={() => setAuthOpen(true)}
                className="shrink-0 px-5 py-2 text-xs font-bold text-white rounded-lg hover:opacity-90 transition-opacity"
                style={{ background: '#252450' }}
              >
                Sign in →
              </button>
            </div>
          </div>
        )}
      </div>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  )
}
