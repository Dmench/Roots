import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createUserClient, createAdminClient } from '@/lib/supabase/server'

const client = new Anthropic()

const MAX_QUESTION_CHARS = 600
const DAILY_LIMIT = 20

async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const admin = createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    // Atomic increment via Postgres function — avoids race conditions
    const { data: count, error } = await admin.rpc('increment_ask_count', {
      uid: userId,
      day: today,
    })

    if (error) {
      // Table or function missing — fail open but log so we know the migration hasn't run
      if (error.code === '42P01' || error.code === 'PGRST202') {
        console.warn('[rate-limit] increment_ask_count missing — run supabase/migration_ask_rate_limits.sql')
        return { allowed: true, remaining: DAILY_LIMIT }
      }
      console.error('[rate-limit] unexpected error:', error.code, error.message)
      return { allowed: true, remaining: DAILY_LIMIT }
    }

    const n = (count as number) ?? 1
    return { allowed: n <= DAILY_LIMIT, remaining: Math.max(0, DAILY_LIMIT - n) }
  } catch {
    // Fail open — don't block users on rate limit errors
    return { allowed: true, remaining: DAILY_LIMIT }
  }
}

export async function POST(req: NextRequest) {
  try {
    // Auth guard — reject unauthenticated requests before touching Claude
    const authHeader = req.headers.get('Authorization') ?? ''
    const token      = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: { user } } = await createUserClient(token).auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limit check
    const { allowed, remaining } = await checkRateLimit(user.id)
    if (!allowed) {
      return NextResponse.json(
        { error: `Daily limit reached (${DAILY_LIMIT} questions/day). Resets at midnight.` },
        { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
      )
    }

    const { question, city, stage, situations } = await req.json()

    if (!question?.trim()) {
      return NextResponse.json({ error: 'Question required' }, { status: 400 })
    }
    if (question.length > MAX_QUESTION_CHARS) {
      return NextResponse.json({ error: `Question too long (max ${MAX_QUESTION_CHARS} characters)` }, { status: 400 })
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

    return NextResponse.json({ answer, sources, relatedTasks }, {
      headers: { 'X-RateLimit-Remaining': String(remaining) }
    })
  } catch (err) {
    console.error('[ask]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
