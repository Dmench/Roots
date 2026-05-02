import { getWeather } from '@/lib/data/weather'
import type { WeatherData, DayForecast } from '@/lib/data/weather'

interface Props {
  cityId: string
}

export async function WeatherWidget({ cityId }: Props) {
  const weather = await getWeather(cityId)
  if (!weather) return null

  const { current, forecast } = weather
  const today    = forecast[0]
  const upcoming = forecast.slice(1, 5)

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between pb-3 mb-1"
        style={{ borderBottom: '1px solid rgba(10,10,10,0.12)' }}>
        <span className="text-xs font-black tracking-[0.16em] uppercase"
          style={{ color: 'rgba(10,10,10,0.5)' }}>
          Weather
        </span>
        <span className="text-[9px] font-medium" style={{ color: 'rgba(10,10,10,0.25)' }}>
          Open-Meteo
        </span>
      </div>

      {/* Today — hero row */}
      <div className="flex items-center gap-4 py-4"
        style={{ borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
        <span className="text-4xl leading-none" role="img" aria-label={current.description}>
          {current.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-display font-black text-2xl" style={{ color: '#0A0A0A' }}>
              {current.temp}°
            </span>
            <span className="text-sm" style={{ color: 'rgba(10,10,10,0.4)' }}>
              Feels {current.apparentTemp}°
            </span>
          </div>
          <p className="text-xs" style={{ color: 'rgba(10,10,10,0.45)' }}>
            {current.description} · {today?.high}° / {today?.low}° · {current.windKph} km/h
          </p>
        </div>
      </div>

      {/* 4-day strip */}
      <div className="grid grid-cols-4 gap-0 mt-3">
        {upcoming.map((day: DayForecast) => (
          <div key={day.date} className="flex flex-col items-center gap-0.5 px-1 py-2">
            <span className="text-[9px] font-black tracking-wide uppercase"
              style={{ color: 'rgba(10,10,10,0.35)' }}>
              {day.label.split(' ')[0]}
            </span>
            <span className="text-lg leading-none my-0.5" role="img" aria-label={day.icon}>
              {day.icon}
            </span>
            <span className="text-[10px] font-bold" style={{ color: '#0A0A0A' }}>
              {day.high}°
            </span>
            <span className="text-[9px]" style={{ color: 'rgba(10,10,10,0.35)' }}>
              {day.low}°
            </span>
            {day.rainMm > 0 && (
              <span className="text-[9px]" style={{ color: '#38C0F0' }}>
                {day.rainMm}mm
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
