import { Point, WalkWeather } from "../types/walk";

type OpenMeteoResponse = {
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    weather_code?: number[];
  };
};

function conditionFromCode(code: number): WalkWeather["condition"] {
  if (code === 0) return "clear";
  if ([1, 2, 3].includes(code)) return "cloudy";
  if ([45, 48].includes(code)) return "fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "drizzle";
  if ([61, 63, 65, 66, 67, 80, 81].includes(code)) return "rain";
  if ([82].includes(code)) return "heavy_rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "storm";
  return "unknown";
}

export async function fetchWalkWeather(point: Point | undefined, startedAt: Date): Promise<WalkWeather | null> {
  if (!point) return null;

  const day = startedAt.toISOString().slice(0, 10);
  const params = new URLSearchParams({
    latitude: String(point.latitude),
    longitude: String(point.longitude),
    hourly: "temperature_2m,weather_code",
    timezone: "auto",
    start_date: day,
    end_date: day,
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!response.ok) throw new Error(`Weather request failed with ${response.status}`);

  const data = await response.json() as OpenMeteoResponse;
  const times = data.hourly?.time ?? [];
  const temperatures = data.hourly?.temperature_2m ?? [];
  const codes = data.hourly?.weather_code ?? [];
  if (!times.length || !temperatures.length || !codes.length) return null;

  const target = startedAt.getTime();
  let bestIndex = 0;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (let index = 0; index < times.length; index += 1) {
    const diff = Math.abs(new Date(times[index]).getTime() - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = index;
    }
  }

  const temperatureC = temperatures[bestIndex];
  const code = codes[bestIndex];
  if (!Number.isFinite(temperatureC) || !Number.isFinite(code)) return null;

  return {
    temperatureC: Math.round(temperatureC),
    condition: conditionFromCode(code),
    code,
  };
}

export function weatherLabel(weather: WalkWeather | null | undefined) {
  if (!weather) return null;
  const label = {
    clear: "Clear",
    cloudy: "Cloudy",
    fog: "Fog",
    drizzle: "Drizzle",
    rain: "Rain",
    heavy_rain: "Heavy rain",
    snow: "Snow",
    storm: "Storm",
    unknown: "Weather",
  }[weather.condition];
  return `${label} · ${Math.round(weather.temperatureC)}°`;
}
