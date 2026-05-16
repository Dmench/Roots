import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createUserClient, createAdminClient } from '@/lib/supabase/server'

const client = new Anthropic()

const MAX_QUESTION_CHARS = 600
const DAILY_LIMIT = 20

// Whitelists — we never trust user-supplied strings inside the system prompt.
const ALLOWED_CITY_IDS  = new Set(['brussels', 'lisbon', 'berlin', 'barcelona', 'amsterdam', 'prague'])
const ALLOWED_STAGES    = new Set(['planning', 'just_arrived', 'settling', 'settled'])
const ALLOWED_SITUATIONS = new Set([
  'new_to_country', 'new_to_city', 'new_to_neighborhood', 'local',
  'renting', 'buying', 'employed', 'self_employed', 'student', 'family',
  'partner_visa', 'digital_nomad', 'eu_citizen', 'non_eu',
])

// Invariant system prompt — same on every request, so we attach
// cache_control: ephemeral. Anthropic caches it at ~90% input-token discount.
const SYSTEM_INVARIANT = `You are Roots, a city intelligence platform for anyone new to a city — whether they moved from another country, another city in the same country, or just across town. You give practical, specific, accurate answers about living in the user's city — covering admin, housing, healthcare, transport, tax, neighbourhoods, and daily life.

Rules:
- Be specific to the city. Never give generic travel-guide advice.
- Do not assume the user is an international expat. Many users moved from within the same country, or even from another neighbourhood in the same city. Tailor your answer to the situations the user actually has, not stereotypes.
- Be honest about complexity and delays — if something is slow or difficult, say so clearly.
- Lead with the most actionable information. Use concrete details: office names, costs, timelines, document names, phone numbers.
- If there are known exceptions or gotchas, mention them.
- Where you cite sources, use only real, verifiable URLs from official government or institutional websites. Never invent URLs. URLs must start with https:// (or http:// for local/dev sources only). Any other scheme will be rejected and discarded.

Format: clear prose paragraphs. Use bullet points only for sequential steps or parallel lists. Use **bold** for key terms or important warnings. Keep responses under 350 words — be dense and useful, not verbose.

At the end of your response, on its own line, append this JSON block (it will be parsed and hidden from the user):
\`\`\`json
{"sources":["url1"],"relatedTasks":["task-slug"]}
\`\`\`
Only include URLs you are highly confident exist and are current. Leave arrays empty if unsure. relatedTasks must use kebab-case slugs (a-z, 0-9, hyphens only, max 60 chars).`

// URL sanitiser: only http/https schemes survive. Defends against
// javascript:/data:/file: schemes that would XSS the rendered <a href>.
function safeUrl(u: unknown): string | null {
  if (typeof u !== 'string' || u.length > 2000) return null
  try {
    const url = new URL(u)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    return url.toString()
  } catch { return null }
}

function safeSlug(s: unknown): string | null {
  if (typeof s !== 'string') return null
  return /^[a-z0-9-]{1,60}$/.test(s) ? s : null
}

async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const admin = createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    const { data: count, error } = await admin.rpc('increment_ask_count', {
      uid: userId,
      day: today,
    })

    if (error) {
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
    return { allowed: true, remaining: DAILY_LIMIT }
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const token      = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: { user } } = await createUserClient(token).auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { allowed, remaining } = await checkRateLimit(user.id)
    if (!allowed) {
      return NextResponse.json(
        { error: `Daily limit reached (${DAILY_LIMIT} questions/day). Resets at midnight.` },
        { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
      )
    }

    const body = await req.json()
    const question = typeof body?.question === 'string' ? body.question.trim() : ''
    if (!question) return NextResponse.json({ error: 'Question required' }, { status: 400 })
    if (question.length > MAX_QUESTION_CHARS) {
      return NextResponse.json({ error: `Question too long (max ${MAX_QUESTION_CHARS} characters)` }, { status: 400 })
    }

    // Whitelist user-supplied context — we never let these flow raw into the system prompt
    const cityId      = ALLOWED_CITY_IDS.has(body?.city)  ? String(body.city)  : 'brussels'
    const cityName    = cityId.charAt(0).toUpperCase() + cityId.slice(1)
    const stage       = ALLOWED_STAGES.has(body?.stage)   ? String(body.stage) : null
    const situations  = Array.isArray(body?.situations)
      ? body.situations.filter((s: unknown): s is string =>
          typeof s === 'string' && ALLOWED_SITUATIONS.has(s)).slice(0, 14)
      : []

    const userContext = [
      `City: ${cityName}.`,
      stage              ? `Stage: ${stage.replace(/_/g, ' ')}.`              : null,
      situations.length  ? `Situations: ${situations.join(', ')}.`            : null,
    ].filter(Boolean).join(' ')

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      // Split the system prompt so the invariant block is cached.
      // ~90% input-token discount on subsequent requests within the cache TTL.
      system: [
        { type: 'text', text: SYSTEM_INVARIANT, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: userContext },
      ],
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
        sources = (Array.isArray(meta.sources) ? meta.sources : [])
          .map(safeUrl)
          .filter((u: string | null): u is string => u !== null)
          .slice(0, 6)
        relatedTasks = (Array.isArray(meta.relatedTasks) ? meta.relatedTasks : [])
          .map(safeSlug)
          .filter((s: string | null): s is string => s !== null)
          .slice(0, 4)
        answer = block.text.replace(/\n?```json\n[\s\S]*?\n```/, '').trim()
      } catch { /* leave defaults */ }
    }

    // Cache telemetry — visible only in logs, useful for unit-econ tracking
    const usage = (response as { usage?: { cache_read_input_tokens?: number; cache_creation_input_tokens?: number; input_tokens?: number; output_tokens?: number } }).usage
    if (usage) {
      const cacheHit = (usage.cache_read_input_tokens ?? 0) > 0
      console.log('[ask]', JSON.stringify({
        user: user.id.slice(0, 8),
        cacheHit,
        cacheRead: usage.cache_read_input_tokens ?? 0,
        cacheCreate: usage.cache_creation_input_tokens ?? 0,
        input: usage.input_tokens ?? 0,
        output: usage.output_tokens ?? 0,
      }))
    }

    return NextResponse.json({ answer, sources, relatedTasks }, {
      headers: { 'X-RateLimit-Remaining': String(remaining) }
    })
  } catch (err) {
    console.error('[ask]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
