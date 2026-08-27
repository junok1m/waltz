import type { WalkWeather } from "../types/walk";

export function conditionFromCode(code: number): WalkWeather["condition"] {
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

export function conditionWithPrecipitation(
  code: number,
  precipitation: number,
  rain: number,
  showers: number,
): WalkWeather["condition"] {
  const codedCondition = conditionFromCode(code);

  // Preserve severe/specific WMO conditions even if point precipitation is zero.
  if (["storm", "snow", "heavy_rain"].includes(codedCondition)) return codedCondition;

  const liquidPrecipitation = Math.max(precipitation, rain, showers);
  if (liquidPrecipitation > 0.5) return "rain";
  if (liquidPrecipitation > 0) return "drizzle";

  return codedCondition;
}
