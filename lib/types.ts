// Cities
export type CityId = 'brussels' | 'lisbon' | 'berlin' | 'barcelona' | 'amsterdam' | 'prague'

export interface City {
  id: CityId
  name: string
  country: string
  tagline: string
  description: string
  heroGradient: string   // CSS gradient string
  accentColor: string    // tailwind color class e.g. 'terracotta'
  active: boolean        // false = coming soon
  settlerCount: number   // mock count for social proof
  timezone: string
}

// User journey
export type Stage = 'planning' | 'just_arrived' | 'settling' | 'settled'

export interface StageConfig {
  id: Stage
  label: string
  sublabel: string
  months: string  // e.g. "Before you arrive" or "0–3 months"
}

export type SituationTag =
  | 'renting'
  | 'buying'
  | 'employed'
  | 'self_employed'
  | 'student'
  | 'family'
  | 'partner_visa'
  | 'digital_nomad'
  | 'eu_citizen'
  | 'non_eu'

export interface SituationConfig {
  id: SituationTag
  label: string
  icon: string  // emoji
}

// Tasks
export type TaskCategory =
  | 'admin'
  | 'housing'
  | 'money'
  | 'health'
  | 'transport'
  | 'community'
  | 'work'
  | 'daily'

export type TaskDifficulty = 'easy' | 'medium' | 'hard'

export interface TaskLink {
  label: string
  url: string
  type: 'official' | 'affiliate' | 'community'
}

export interface TaskStep {
  step: string
  detail?: string
}

export interface Task {
  id: string
  cityId: CityId
  title: string
  slug: string
  category: TaskCategory
  stageRelevance: Stage[]
  situationRelevance: SituationTag[]  // empty = relevant to all
  summary: string          // 1–2 sentence summary
  guide: string            // detailed markdown-style prose
  steps: TaskStep[]
  tip?: string             // pro tip callout
  estimatedTime: string    // e.g. "2 hours", "1–2 weeks"
  difficulty: TaskDifficulty
  links: TaskLink[]
}

// Community
export type PostCategory = 'recommendation' | 'question' | 'heads-up'

export interface Post {
  id: string
  cityId: CityId
  stage?: Stage
  category: PostCategory
  text: string
  time: string
  authorStage?: Stage
}

// User profile (Supabase)
export interface UserProfile {
  id: string
  displayName?: string
  cityId: CityId
  neighborhood?: string
  languages: string[]
  arrivalDate?: string
  stage: Stage
  situations: SituationTag[]
  completedTaskIds: string[]
  savedTaskIds: string[]
}
