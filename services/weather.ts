import { Point, WalkWeather } from "../types/walk";

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
  };
};

function conditionFromCode(code: number): WalkWeather["condition"] {
  if (code === 0) return "clear";
  if ([1, 2, 3].includes(code)) return "cloudy";
  if ([45, 48].includes(code)) return "fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "drizzle";
  if ([61, 63, 65, 66, 67, 80, 81].includes(code)) return "rain";
  if (code === 82) return "heavy_rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "storm";
  return "unknown";
}

export async function fetchWalkWeather(point: Point | undefined, _startedAt: Date): Promise<WalkWeather | null> {
  if (!point) return null;

  const latitude = encodeURIComponent(String(point.latitude));
  const longitude = encodeURIComponent(String(point.longitude));
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Weather request failed with ${response.status}`);

  const data = await response.json() as OpenMeteoResponse;
  const temperatureC = data.current?.temperature_2m;
  const code = data.current?.weather_code;
  if (!Number.isFinite(temperatureC) || !Number.isFinite(code)) {
    throw new Error("Weather response did not include current temperature/code");
  }

  return {
    temperatureC: Math.round(temperatureC as number),
    condition: conditionFromCode(code as number),
    code: code as number,
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
