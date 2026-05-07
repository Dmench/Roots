// Open-Meteo — free, no API key required
// Docs: https://open-meteo.com/en/docs

export interface DayForecast {
  date:       string   // ISO date e.g. "2026-05-01"
  label:      string   // e.g. "Thu 1"
  code:       number   // WMO weather interpretation code
  icon:       string   // emoji
  high:       number
  low:        number
  rainMm:     number
}

export interface CurrentWeather {
  temp:          number
  apparentTemp:  number
  code:          number
  icon:          string
  description:   string
  windKph:       number
}

export interface WeatherData {
  current:  CurrentWeather
  forecast: DayForecast[]  // 7 days including today
  updatedAt: number        // unix ms
}

// WMO code → { icon, description }
// https://open-meteo.com/en/docs#weathervariables
function wmoLabel(code: number): { icon: string; description: string } {
  if (code === 0)              return { icon: '☀️',  description: 'Clear sky' }
  if (code === 1)              return { icon: '🌤️', description: 'Mainly clear' }
  if (code === 2)              return { icon: '⛅',  description: 'Partly cloudy' }
  if (code === 3)              return { icon: '☁️',  description: 'Overcast' }
  if (code === 45 || code === 48) return { icon: '🌫️', description: 'Foggy' }
  if (code >= 51 && code <= 55)   return { icon: '🌦️', description: 'Drizzle' }
  if (code >= 61 && code <= 65)   return { icon: '🌧️', description: 'Rain' }
  if (code >= 71 && code <= 77)   return { icon: '❄️',  description: 'Snow' }
  if (code >= 80 && code <= 82)   return { icon: '🌦️', description: 'Rain showers' }
  if (code >= 85 && code <= 86)   return { icon: '🌨️', description: 'Snow showers' }
  if (code === 95)             return { icon: '⛈️',  description: 'Thunderstorm' }
  if (code >= 96 && code <= 99)   return { icon: '⛈️',  description: 'Thunderstorm with hail' }
  return { icon: '🌡️', description: 'Unknown' }
}

const CITY_COORDS: Record<string, { lat: number; lon: number; tz: string }> = {
  brussels:  { lat: 50.85, lon: 4.35,   tz: 'Europe/Brussels' },
  lisbon:    { lat: 38.72, lon: -9.14,  tz: 'Europe/Lisbon' },
  berlin:    { lat: 52.52, lon: 13.41,  tz: 'Europe/Berlin' },
  barcelona: { lat: 41.39, lon: 2.16,   tz: 'Europe/Madrid' },
  amsterdam: { lat: 52.37, lon: 4.90,   tz: 'Europe/Amsterdam' },
  prague:    { lat: 50.08, lon: 14.44,  tz: 'Europe/Prague' },
}

export async function getWeather(cityId: string): Promise<WeatherData | null> {
  const coords = CITY_COORDS[cityId]
  if (!coords) return null

  const params = new URLSearchParams({
    latitude:  String(coords.lat),
    longitude: String(coords.lon),
    timezone:  coords.tz,
    forecast_days: '7',
    current: [
      'temperature_2m',
      'apparent_temperature',
      'weathercode',
      'windspeed_10m',
    ].join(','),
    daily: [
      'weathercode',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
    ].join(','),
  })

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params}`,
      { next: { revalidate: 1800 }, signal: AbortSignal.timeout(10000) }
    )
    if (!res.ok) return null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json: any = await res.json()

    const cur = json.current
    const curLabel = wmoLabel(cur.weathercode)
    const current: CurrentWeather = {
      temp:         Math.round(cur.temperature_2m),
      apparentTemp: Math.round(cur.apparent_temperature),
      code:         cur.weathercode,
      icon:         curLabel.icon,
      description:  curLabel.description,
      windKph:      Math.round(cur.windspeed_10m),
    }

    const daily = json.daily
    const forecast: DayForecast[] = (daily.time as string[]).map((date, i) => {
      const d = new Date(date + 'T12:00:00')
      const label = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })
      const lbl   = wmoLabel(daily.weathercode[i])
      return {
        date,
        label,
        code:    daily.weathercode[i],
        icon:    lbl.icon,
        high:    Math.round(daily.temperature_2m_max[i]),
        low:     Math.round(daily.temperature_2m_min[i]),
        rainMm:  Math.round((daily.precipitation_sum[i] ?? 0) * 10) / 10,
      }
    })

    return { current, forecast, updatedAt: Date.now() }
  } catch {
    return null
  }
}
