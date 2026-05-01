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

// Spots — user's favourite places
export type SpotCategory = 'cafe' | 'bar' | 'restaurant' | 'bookstore' | 'record' | 'shop' | 'market'

export interface Spot {
  id: string
  name: string
  category: SpotCategory
  note?: string
  // Google Places data (populated when found via search)
  placeId?: string
  address?: string
  photoRef?: string   // photo_reference for /api/places/photo proxy
  rating?: number
}

export const SPOT_CATEGORIES: { id: SpotCategory; label: string; color: string }[] = [
  { id: 'cafe',       label: 'Cafe',        color: '#B08800' },
  { id: 'bar',        label: 'Bar',         color: '#4744C8' },
  { id: 'restaurant', label: 'Restaurant',  color: '#E8612A' },
  { id: 'bookstore',  label: 'Bookstore',   color: '#10B981' },
  { id: 'record',     label: 'Record shop', color: '#FF3EBA' },
  { id: 'shop',       label: 'Shop',        color: '#38C0F0' },
  { id: 'market',     label: 'Market',      color: '#FAB400' },
]

// Social graph
export interface Follow {
  follower_id:  string
  following_id: string
  created_at:   string
}

export interface PostComment {
  id:         string
  post_id:    string
  author_id:  string
  text:       string
  created_at: string
  // joined from profiles:
  author_name?: string
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
  showInDirectory?: boolean
  digestSubscribed?: boolean
  spots: Spot[]
}
