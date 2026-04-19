import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

// In-memory rate limiter — 10 req / IP / minute
// Replace with Upstash Redis for multi-instance / serverless production
const rl = new Map<string, { count: number; reset: number }>()
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rl.get(ip)
  if (!entry || now > entry.reset) {
    rl.set(ip, { count: 1, reset: now + 60_000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  // Rate limit
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests — wait a minute and try again.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  try {
    const { question, city, stage, situations } = await req.json()

    if (!question?.trim()) {
      return NextResponse.json({ error: 'Question required' }, { status: 400 })
    }
    if (question.length > 1000) {
      return NextResponse.json({ error: 'Question too long (max 1000 characters)' }, { status: 400 })
    }

    const cityName       = city ? city.charAt(0).toUpperCase() + city.slice(1) : 'your city'
    const stageLabel     = stage ? ` who is ${stage.replace(/_/g, ' ')}` : ''
    const situationLabel = situations?.length > 0 ? `, with situations: ${situations.join(', ')}` : ''

    const systemPrompt = `You are Roots, a city intelligence platform. You give practical, specific, accurate answers about living in ${cityName} — covering admin, housing, healthcare, transport, tax, and daily life.

The user is in ${cityName}${stageLabel}${situationLabel}.

Rules:
- Be specific to ${cityName}. Never give generic expat or travel-guide advice.
- Be honest about complexity and delays — if something is slow or difficult, say so clearly.
- Lead with the most actionable information. Use concrete details: office names, costs, timelines, document names, phone numbers.
- If there are known exceptions or gotchas, mention them.
- Where you cite sources, use only real, verifiable URLs from official government or institutional websites. Never invent URLs.

Format: clear prose paragraphs. Use bullet points only for sequential steps or parallel lists. Use **bold** for key terms or important warnings. Keep responses under 350 words — be dense and useful, not verbose.

At the end of your response, on its own line, append this JSON block (it will be parsed and hidden from the user):
\`\`\`json
{"sources":["url1"],"relatedTasks":["task-slug"]}
\`\`\`
Only include URLs you are highly confident exist and are current. Leave arrays empty if unsure.`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: question }],
    })

    const block = response.content[0]
    if (block.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response type' }, { status: 500 })
    }

    const jsonMatch = block.text.match(/```json\n([\s\S]*?)\n```/)
    let sources: string[] = []
    let relatedTasks: string[] = []
    let answer = block.text

    if (jsonMatch) {
      try {
        const meta = JSON.parse(jsonMatch[1])
        sources      = Array.isArray(meta.sources)      ? meta.sources      : []
        relatedTasks = Array.isArray(meta.relatedTasks) ? meta.relatedTasks : []
        answer       = block.text.replace(/\n?```json\n[\s\S]*?\n```/, '').trim()
      } catch { /* leave defaults */ }
    }

    return NextResponse.json({ answer, sources, relatedTasks })
  } catch (err) {
    console.error('[ask]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
