import * as Location from "expo-location";
import type { Point, WalkLocation } from "../types/walk";

function clean(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function representativeWalkPoint(points: Point[]) {
  if (!points.length) return undefined;
  return points[Math.floor(points.length / 2)] ?? points[0];
}

export async function fetchWalkLocation(point: Point | undefined): Promise<WalkLocation | null> {
  if (!point) return null;

  const [address] = await Location.reverseGeocodeAsync({
    latitude: point.latitude,
    longitude: point.longitude,
  });

  return {
    suburbName: clean(address?.city) ?? clean(address?.district) ?? clean(address?.subregion),
    region: clean(address?.region),
    postcode: clean(address?.postalCode),
    countryCode: clean(address?.isoCountryCode)?.toUpperCase() ?? null,
    latitude: point.latitude,
    longitude: point.longitude,
  };
}
