import { getTransportStatus } from '@/lib/data/transport'
import type { TransportDisruption } from '@/lib/data/transport'

interface Props {
  cityId: string
}

const SEVERITY_COLOR: Record<TransportDisruption['severity'], string> = {
  info:     '#38C0F0',
  warning:  '#FAB400',
  critical: '#C8152A',
}

const TYPE_LABEL: Record<TransportDisruption['type'], string> = {
  metro: 'M',
  tram:  'T',
  bus:   'B',
  all:   'All',
}

export async function TransportWidget({ cityId }: Props) {
  if (cityId !== 'brussels') return null
  const { disruptions, hasService } = await getTransportStatus(cityId)

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between pb-3 mb-1"
        style={{ borderBottom: '1px solid rgba(10,10,10,0.12)' }}>
        <span className="text-xs font-black tracking-[0.16em] uppercase"
          style={{ color: 'rgba(10,10,10,0.5)' }}>
          Transport
        </span>
        <a href="https://www.stib-mivb.be/disruptions.htm?l=en"
          target="_blank" rel="noopener noreferrer"
          className="text-[9px] font-medium hover:opacity-60 transition-opacity"
          style={{ color: 'rgba(10,10,10,0.25)' }}>
          STIB →
        </a>
      </div>

      {disruptions.length === 0 ? (
        <div className="flex items-center gap-2 py-3">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#10B981' }} />
          <p className="text-xs" style={{ color: 'rgba(10,10,10,0.55)' }}>
            {hasService ? 'No disruptions reported' : 'Service status unavailable'}
          </p>
        </div>
      ) : (
        <div>
          {disruptions.slice(0, 4).map((d: TransportDisruption, i: number) => (
            <a key={d.id}
              href={d.url} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-3 py-2.5 hover:opacity-70 transition-opacity"
              style={{ borderTop: i > 0 ? '1px solid rgba(10,10,10,0.06)' : 'none' }}>
              <span className="shrink-0 w-5 h-5 flex items-center justify-center text-[9px] font-black text-white"
                style={{ background: SEVERITY_COLOR[d.severity] }}>
                {TYPE_LABEL[d.type]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold" style={{ color: '#0A0A0A' }}>{d.line}</p>
                <p className="text-[10px] line-clamp-2 leading-snug mt-0.5"
                  style={{ color: 'rgba(10,10,10,0.45)' }}>
                  {d.description}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  )
}
