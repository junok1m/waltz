import { supabase } from "../lib/supabase";
import type { Point, WalkWeather } from "../types/walk";

type WeatherKitResponse = {
  temperatureC?: number;
  condition?: WalkWeather["condition"];
  code?: number | null;
};

export async function fetchWalkWeather(point: Point | undefined, _startedAt: Date): Promise<WalkWeather | null> {
  if (!point) return null;

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const result = await supabase.functions.invoke("weatherkit-current", {
    body: { latitude: point.latitude, longitude: point.longitude, timezone },
  });

  if (result.error) throw result.error;
  const data = result.data as WeatherKitResponse | null;
  if (!data || !Number.isFinite(data.temperatureC) || !data.condition) {
    throw new Error("WeatherKit response did not include current weather");
  }

  return {
    temperatureC: Math.round(data.temperatureC as number),
    condition: data.condition,
    code: Number.isFinite(data.code) ? (data.code as number) : null,
  };
}

export function weatherLabel(weather: WalkWeather | null | undefined) {
  if (!weather) return null;
  const label = {
    clear: "Clear", cloudy: "Cloudy", fog: "Fog", drizzle: "Drizzle",
    rain: "Rain", heavy_rain: "Heavy rain", snow: "Snow", storm: "Storm", unknown: "Weather",
  }[weather.condition];
  return label + " ·" + Math.round(weather.temperatureC) + "°";
}
