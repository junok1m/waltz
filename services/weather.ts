import type { Point, WalkWeather } from "../types/walk";
import { conditionWithPrecipitation } from "../utils/weatherCondition";

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    precipitation?: number;
    rain?: number;
    showers?: number;
  };
};

export async function fetchWalkWeather(point: Point | undefined, _startedAt: Date): Promise<WalkWeather | null> {
  if (!point) return null;

  const latitude = encodeURIComponent(String(point.latitude));
  const longitude = encodeURIComponent(String(point.longitude));
  const current = "temperature_2m,weather_code,precipitation,rain,showers";
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=${current}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Weather request failed with ${response.status}`);

  const data = await response.json() as OpenMeteoResponse;
  const temperatureC = data.current?.temperature_2m;
  const code = data.current?.weather_code;
  if (!Number.isFinite(temperatureC) || !Number.isFinite(code)) {
    throw new Error("Weather response did not include current temperature/code");
  }

  const precipitation = Number.isFinite(data.current?.precipitation) ? data.current!.precipitation! : 0;
  const rain = Number.isFinite(data.current?.rain) ? data.current!.rain! : 0;
  const showers = Number.isFinite(data.current?.showers) ? data.current!.showers! : 0;

  return {
    temperatureC: Math.round(temperatureC as number),
    condition: conditionWithPrecipitation(code as number, precipitation, rain, showers),
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
