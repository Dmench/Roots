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

    const systemPrompt = `You are Roots, a city onboarding assistant. You help people settle into new cities with practical, specific, accurate answers.

The user is in ${cityName}${stageLabel}${situationLabel}.

Rules:
- Be specific to ${cityName}. Never give generic "expat" advice.
- Be honest about complexity. If something is hard or slow, say so.
- Give actionable steps, not just background.
- Use concrete details: office names, costs, timelines, document names.
- Where you cite sources, use only real, verifiable official government or institution URLs.

Format your response as clear prose, with bullet points only for steps or lists. Keep it under 300 words.

At the end of your response, append this JSON block on its own line (it will be parsed and hidden from the user):
\`\`\`json
{"sources":["url1"],"relatedTasks":["task-slug"]}
\`\`\`
Only include real URLs you are confident exist. Leave arrays empty if unsure.`

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
