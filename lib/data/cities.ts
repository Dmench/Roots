import type { City, StageConfig, SituationConfig } from '@/lib/types'

export const CITIES: City[] = [
  {
    id: 'brussels',
    name: 'Brussels',
    country: 'Belgium',
    tagline: 'Your Brussels roots',
    description: 'The capital of Europe — bureaucratic, multilingual, and endlessly surprising. Where diplomats, EU workers, and locals build an unexpected home.',
    heroGradient: 'linear-gradient(140deg, #08091E 0%, #0F1438 60%, #06091A 100%)',
    accentColor: 'terracotta',
    active: true,
    settlerCount: 312,
    timezone: 'Europe/Brussels',
  },
  {
    id: 'lisbon',
    name: 'Lisbon',
    country: 'Portugal',
    tagline: 'Your Lisbon roots',
    description: 'Sun-drenched hills, affordable living, and a bureaucracy that rewards patience. The new home of digital nomads, remote workers, and life-seekers.',
    heroGradient: 'linear-gradient(140deg, #110900 0%, #231200 60%, #110900 100%)',
    accentColor: 'amber',
    active: false,
    settlerCount: 0,
    timezone: 'Europe/Lisbon',
  },
  {
    id: 'berlin',
    name: 'Berlin',
    country: 'Germany',
    tagline: 'Your Berlin roots',
    description: 'Raw, affordable, and magnetic. A city that rewards those who figure out the Anmeldung, the Kiez, and the pace of a place that never quite finishes becoming itself.',
    heroGradient: 'linear-gradient(140deg, #080D16 0%, #0E1826 60%, #080D16 100%)',
    accentColor: 'sky',
    active: false,
    settlerCount: 0,
    timezone: 'Europe/Berlin',
  },
  {
    id: 'barcelona',
    name: 'Barcelona',
    country: 'Spain',
    tagline: 'Your Barcelona roots',
    description: 'Mediterranean light, impossible architecture, and a NIE number that takes a full morning. Worth every step.',
    heroGradient: 'linear-gradient(140deg, #120616 0%, #200A24 60%, #120616 100%)',
    accentColor: 'coral',
    active: false,
    settlerCount: 0,
    timezone: 'Europe/Madrid',
  },
  {
    id: 'amsterdam',
    name: 'Amsterdam',
    country: 'Netherlands',
    tagline: 'Your Amsterdam roots',
    description: 'Canals, cycling, and a housing market that will test your resilience. Once you find your place, there is nowhere quite like it.',
    heroGradient: 'linear-gradient(140deg, #040E1C 0%, #071A2E 60%, #040E1C 100%)',
    accentColor: 'sage',
    active: false,
    settlerCount: 0,
    timezone: 'Europe/Amsterdam',
  },
  {
    id: 'prague',
    name: 'Prague',
    country: 'Czech Republic',
    tagline: 'Your Prague roots',
    description: 'Central European magic at Central European prices. A city for those who want depth, culture, and a cost of living that still makes sense.',
    heroGradient: 'linear-gradient(140deg, #0C081C 0%, #18102E 60%, #0C081C 100%)',
    accentColor: 'stone',
    active: false,
    settlerCount: 0,
    timezone: 'Europe/Prague',
  },
]

export const ACTIVE_CITIES = CITIES.filter(c => c.active)

export function getCity(id: string): City | undefined {
  return CITIES.find(c => c.id === id)
}

export const STAGES: StageConfig[] = [
  { id: 'planning',     label: 'Planning the move', sublabel: 'Research mode',       months: 'Before you arrive' },
  { id: 'just_arrived', label: 'Just arrived',       sublabel: 'First few weeks',     months: '0–4 weeks in' },
  { id: 'settling',     label: 'Getting settled',    sublabel: 'Building your life',  months: '1–6 months in' },
  { id: 'settled',      label: 'Settled in',         sublabel: 'You know the ropes',  months: '6+ months in' },
]

export const SITUATIONS: SituationConfig[] = [
  { id: 'renting',       label: 'Renting',                    icon: '🏠' },
  { id: 'buying',        label: 'Buying property',            icon: '🔑' },
  { id: 'employed',      label: 'Employed',                   icon: '💼' },
  { id: 'self_employed', label: 'Freelance / Self-employed',  icon: '🧑‍💻' },
  { id: 'student',       label: 'Student',                    icon: '📚' },
  { id: 'family',        label: 'Moving with family',         icon: '👨‍👩‍👧' },
  { id: 'digital_nomad', label: 'Digital nomad',              icon: '🌍' },
  { id: 'eu_citizen',    label: 'EU / EEA citizen',           icon: '🇪🇺' },
  { id: 'non_eu',        label: 'Non-EU citizen',             icon: '🛂' },
]
