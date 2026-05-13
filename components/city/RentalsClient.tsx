'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useProfile } from '@/lib/hooks/use-profile'
import type { CityRentalData, RentalStats } from '@/lib/data/rentals'

interface Props {
  cityId: string
  data:   CityRentalData
}

// Maps a profile.neighborhood label (which can be a commune like
// "Ixelles / Elsene", a sub-area like "Châtelain", or a quarter like
// "European Quarter") to the StatBel commune name that RentalStats uses.
//
// Sub-areas resolve to their containing commune. When the user picks a
// label we don't recognise, return null and the widget falls back to the
// city-average view.
function neighborhoodToCommune(label: string | undefined): string | null {
  if (!label) return null

  // Dual-language commune labels: take the FR side.
  if (label.includes(' / ')) {
    const fr = label.split(' / ')[0]?.trim()
    if (fr) return fr
  }

  // Sub-area / quarter mapping. Best-effort — the commune system in Brussels
  // doesn't map cleanly to micro-neighbourhood identity, but these are the
  // common picks from the onboarding list.
  const SUB_AREAS: Record<string, string> = {
    'Châtelain':           'Ixelles',
    'Flagey':              'Ixelles',
    'Matongé':             'Ixelles',
    'Louise':              'Bruxelles',
    'Louise / Louiza':     'Bruxelles',
    'City centre / Pentagone': 'Bruxelles',
    'European Quarter':    'Etterbeek',
    'Laeken / Laken':      'Bruxelles',
    'Laeken':              'Bruxelles',
  }
  return SUB_AREAS[label] ?? label
}

// Top 6 communes most relevant to people settling — same set as before,
// minus the one matched as the user's commune (which now leads).
const FEATURED_COMMUNES = [
  'Ixelles', 'Saint-Gilles', 'Etterbeek', 'Schaerbeek',
  'Forest', 'Uccle', 'Woluwe-Saint-Lambert', 'Bruxelles',
]

export function RentalsClient({ cityId, data }: Props) {
  const { profile } = useProfile()
  const userCommune = useMemo(
    () => neighborhoodToCommune(profile.neighborhood),
    [profile.neighborhood],
  )

  const userRow = useMemo(
    () => userCommune ? data.communes.find(c => c.commune === userCommune) ?? null : null,
    [data.communes, userCommune],
  )

  // Comparison dropdown — let the user pick a second commune to size up.
  // Defaults to Bruxelles (city centre) when they have a commune of their
  // own, otherwise stays unset and we render the standard featured list.
  const [compareKey, setCompareKey] = useState<string>(() =>
    userCommune ? (userCommune === 'Bruxelles' ? 'Ixelles' : 'Bruxelles') : '',
  )
  const compareRow = compareKey
    ? data.communes.find(c => c.commune === compareKey) ?? null
    : null

  const featuredFallback = FEATURED_COMMUNES
    .map(name => data.communes.find(c => c.commune === name))
    .filter((c): c is RentalStats => !!c)
    .slice(0, 6)

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between pb-3 mb-1"
        style={{ borderBottom: '1px solid rgba(10,10,10,0.12)' }}>
        <span className="text-xs font-black tracking-[0.16em] uppercase"
          style={{ color: 'rgba(10,10,10,0.5)' }}>
          Rent prices
        </span>
        <Link href={`/${cityId}/settle`}
          className="text-[10px] font-black tracking-widest uppercase hover:opacity-50 transition-opacity"
          style={{ color: '#FAB400' }}>
          Settle in →
        </Link>
      </div>

      {/* City average pill — always shown so deltas have something to anchor to */}
      {data.cityAvg1BR && (
        <div className="flex items-center gap-2 py-2.5 mb-1"
          style={{ borderBottom: '1px solid rgba(10,10,10,0.06)' }}>
          <span className="text-[9px] font-black tracking-wide uppercase"
            style={{ color: 'rgba(10,10,10,0.35)' }}>
            City avg
          </span>
          <span className="flex-1" />
          <span className="text-[10px] font-bold" style={{ color: '#FAB400' }}>
            1BR €{data.cityAvg1BR}
          </span>
          {data.cityAvg2BR && (
            <span className="text-[10px]" style={{ color: 'rgba(10,10,10,0.35)' }}>
              · 2BR €{data.cityAvg2BR}
            </span>
          )}
        </div>
      )}

      {userRow ? (
        <>
          {/* Hero — user's own commune, with delta vs city avg */}
          <UserCommuneRow row={userRow} cityAvg1BR={data.cityAvg1BR} />

          {/* Comparison selector + row */}
          <div className="flex items-center gap-2 mt-3 mb-1">
            <span className="text-[9px] font-black tracking-wide uppercase"
              style={{ color: 'rgba(10,10,10,0.35)' }}>
              Compare to
            </span>
            <select
              value={compareKey}
              onChange={e => setCompareKey(e.target.value)}
              className="text-[10px] font-bold py-1 px-1.5 bg-transparent cursor-pointer"
              style={{
                color: '#0A0A0A',
                border: '1px solid rgba(10,10,10,0.1)',
                appearance: 'none',
                WebkitAppearance: 'none',
              }}
            >
              {data.communes
                .filter(c => c.commune !== userCommune)
                .map(c => (
                  <option key={c.commune} value={c.commune}>{c.commune}</option>
                ))}
            </select>
          </div>
          {compareRow && (
            <CompareRow user={userRow} other={compareRow} />
          )}
        </>
      ) : (
        /* No matched commune → standard featured-list view */
        featuredFallback.map((c, i) => (
          <div key={c.commune}
            className="flex items-baseline gap-2 py-2"
            style={{ borderTop: i > 0 ? '1px solid rgba(10,10,10,0.05)' : 'none' }}>
            <span className="text-[10px] font-medium flex-1 truncate"
              style={{ color: '#0A0A0A' }}>
              {c.commune}
            </span>
            {c.avgRent1BR && (
              <span className="text-[10px] font-bold shrink-0"
                style={{ color: 'rgba(10,10,10,0.7)' }}>
                €{c.avgRent1BR}
              </span>
            )}
            {c.avgRent2BR && (
              <span className="text-[10px] shrink-0"
                style={{ color: 'rgba(10,10,10,0.3)' }}>
                / €{c.avgRent2BR}
              </span>
            )}
          </div>
        ))
      )}

      <p className="text-[9px] mt-2" style={{ color: 'rgba(10,10,10,0.2)' }}>
        StatBel survey {data.communes[0]?.year ?? '2023'} · avg/month · may not reflect current market
      </p>
    </section>
  )
}

function UserCommuneRow({ row, cityAvg1BR }: { row: RentalStats; cityAvg1BR: number | null }) {
  const delta = (row.avgRent1BR && cityAvg1BR)
    ? Math.round(((row.avgRent1BR - cityAvg1BR) / cityAvg1BR) * 100)
    : null
  const deltaColor = delta === null
    ? 'rgba(10,10,10,0.4)'
    : delta > 0 ? '#C0392B' : '#0E9B6B'

  return (
    <div className="py-3" style={{ borderBottom: '1px solid rgba(10,10,10,0.06)' }}>
      <p className="text-[9px] font-black tracking-[0.22em] uppercase mb-1.5"
        style={{ color: '#FAB400' }}>
        Your commune
      </p>
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-display font-black text-base leading-tight"
          style={{ color: '#0A0A0A', letterSpacing: '-0.01em' }}>
          {row.commune}
        </p>
        <div className="text-right">
          {row.avgRent1BR && (
            <p className="text-sm font-black" style={{ color: '#0A0A0A' }}>
              €{row.avgRent1BR}
            </p>
          )}
          {delta !== null && (
            <p className="text-[10px] font-bold" style={{ color: deltaColor }}>
              {delta > 0 ? '+' : ''}{delta}% vs city
            </p>
          )}
        </div>
      </div>
      {row.avgRent2BR && (
        <p className="text-[10px] mt-1" style={{ color: 'rgba(10,10,10,0.4)' }}>
          2BR €{row.avgRent2BR}
          {row.avgRent3BR && <> · 3BR €{row.avgRent3BR}</>}
        </p>
      )}
    </div>
  )
}

function CompareRow({ user, other }: { user: RentalStats; other: RentalStats }) {
  const diff = (user.avgRent1BR && other.avgRent1BR)
    ? user.avgRent1BR - other.avgRent1BR
    : null
  const absDiff = diff !== null ? Math.abs(diff) : null
  // "Your commune is X €/month more/less than Y" — pure plain English.
  const verb = diff === null ? null : diff > 0 ? 'more' : 'less'

  return (
    <div className="py-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-bold" style={{ color: '#0A0A0A' }}>
          {other.commune}
        </p>
        <div className="text-right">
          {other.avgRent1BR && (
            <p className="text-xs font-bold" style={{ color: 'rgba(10,10,10,0.7)' }}>
              €{other.avgRent1BR}
            </p>
          )}
        </div>
      </div>
      {absDiff !== null && verb && (
        <p className="text-[10px] mt-1.5 leading-snug" style={{ color: 'rgba(10,10,10,0.45)' }}>
          {user.commune} is <span style={{ color: '#0A0A0A', fontWeight: 700 }}>€{absDiff}/month {verb}</span> than {other.commune}.
        </p>
      )}
    </div>
  )
}
