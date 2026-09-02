import * as Location from "expo-location";
import type { Point, WalkLocation, WalkPlace } from "../types/walk";
import { sampleRouteForPlaces, summarizeRoutePlaces } from "../utils/walkPlaces";

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

export async function fetchWalkPlaces(points: Point[]): Promise<WalkPlace[]> {
  const routeSamples = sampleRouteForPlaces(points);
  const located = [];

  // Expo warns that geocoding too many coordinates concurrently can fail. Keep this
  // intentionally sequential; a typical 4 km walk needs about 15 lookups at most.
  for (const sample of routeSamples) {
    try {
      const location = await fetchWalkLocation(sample.point);
      if (location?.suburbName) located.push({ ...sample, location });
    } catch (error) {
      console.warn("Couldn't identify one place along the walk:", error);
    }
  }

  return summarizeRoutePlaces(located);
}
