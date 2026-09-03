import * as Location from "expo-location";
import type { Point, WalkLocation, WalkPlace } from "../types/walk";
import { sampleRouteForPlaces, summarizeRoutePlaces } from "../utils/walkPlaces";

const GEOCODE_GAP_MS = 175;
const GEOCODE_RETRY_DELAY_MS = 450;

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

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

// CLGeocoder can briefly reject a burst, or return an empty placemark, even when
// calls are sequential. One delayed retry prevents a missed suburb from vanishing.
async function fetchWalkLocationWithRetry(point: Point) {
  try {
    const location = await fetchWalkLocation(point);
    if (location?.suburbName) return location;
  } catch (firstError) {
    await wait(GEOCODE_RETRY_DELAY_MS);
    try {
      return await fetchWalkLocation(point);
    } catch {
      throw firstError;
    }
  }

  // A throttled CLGeocoder request can also resolve with no useful placemark.
  await wait(GEOCODE_RETRY_DELAY_MS);
  return fetchWalkLocation(point);
}

export async function fetchWalkPlaces(points: Point[]): Promise<WalkPlace[]> {
  const routeSamples = sampleRouteForPlaces(points);
  const located = [];

  // Expo warns that geocoding too many coordinates can fail. Sequential calls alone
  // can still arrive as a burst on iOS, so pace them and retry transient failures.
  for (const [index, sample] of routeSamples.entries()) {
    if (index > 0) await wait(GEOCODE_GAP_MS);
    try {
      const location = await fetchWalkLocationWithRetry(sample.point);
      if (location?.suburbName) located.push({ ...sample, location });
    } catch (error) {
      console.warn("Couldn't identify one place along the walk:", error);
    }
  }

  return summarizeRoutePlaces(located);
}
