// Single source of truth for stage-derived presentation colours.
// Used by avatars, member chips, the settler card, and anywhere else we
// surface someone's stage at a glance. Keeps the same colour register the
// landing page and city hub already establish.
import type { Stage } from '@/lib/types'

export interface StageStyle {
  /** Background fill for an avatar / chip — saturated. */
  bg:   string
  /** Foreground for text/initial against the bg above. */
  fg:   string
  /** Soft tint for chip backgrounds (bg + low alpha). */
  tint: string
  /** Friendly label for "X is just_arrived". */
  label: string
}

export const STAGE_STYLES: Record<Stage, StageStyle> = {
  planning:     { bg: '#6865CC', fg: '#FFFFFF', tint: 'rgba(104,101,204,0.12)', label: 'Planning'        },
  just_arrived: { bg: '#B88A00', fg: '#FFFFFF', tint: 'rgba(184,138,0,0.14)',   label: 'Just arrived'    },
  settling:     { bg: '#1A8FAD', fg: '#FFFFFF', tint: 'rgba(26,143,173,0.14)',  label: 'Getting settled' },
  settled:      { bg: '#0E9B6B', fg: '#FFFFFF', tint: 'rgba(14,155,107,0.14)',  label: 'Settled'         },
}

/** Default avatar colour when a user's stage is unknown — brand navy. */
export const DEFAULT_AVATAR: StageStyle = {
  bg:   '#252450',
  fg:   '#FFFFFF',
  tint: 'rgba(37,36,80,0.1)',
  label: 'Settler',
}

export function avatarStyle(stage: Stage | null | undefined): StageStyle {
  return stage ? STAGE_STYLES[stage] : DEFAULT_AVATAR
}
