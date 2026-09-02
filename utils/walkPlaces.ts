import type { Point, WalkLocation, WalkPlace } from "../types/walk";
import { getDistanceInKm } from "./distance";

export const PLACE_SAMPLE_SPACING_KM = 0.3;
export const MAX_PLACE_SAMPLES = 20;
export const MIN_MEANINGFUL_PLACE_KM = 0.25;

export type RoutePlaceSample = {
  point: Point;
  distanceAlongKm: number;
};

export type LocatedRoutePlaceSample = RoutePlaceSample & {
  location: WalkLocation;
};

function validPoint(point: Point) {
  return Number.isFinite(point.latitude)
    && Number.isFinite(point.longitude)
    && point.latitude >= -90
    && point.latitude <= 90
    && point.longitude >= -180
    && point.longitude <= 180;
}

function interpolate(a: Point, b: Point, ratio: number): Point {
  return {
    latitude: a.latitude + (b.latitude - a.latitude) * ratio,
    longitude: a.longitude + (b.longitude - a.longitude) * ratio,
  };
}

export function sampleRouteForPlaces(points: Point[]): RoutePlaceSample[] {
  const route = points.filter(validPoint);
  if (!route.length) return [];
  if (route.length === 1) return [{ point: route[0], distanceAlongKm: 0 }];

  const cumulative = [0];
  for (let index = 1; index < route.length; index += 1) {
    cumulative.push(cumulative[index - 1] + getDistanceInKm(route[index - 1], route[index]));
  }

  const totalKm = cumulative[cumulative.length - 1];
  if (totalKm <= 0) return [{ point: route[0], distanceAlongKm: 0 }];

  const spacingKm = Math.max(PLACE_SAMPLE_SPACING_KM, totalKm / (MAX_PLACE_SAMPLES - 1));
  const targets = [0];
  for (let distance = spacingKm; distance < totalKm; distance += spacingKm) targets.push(distance);
  targets.push(totalKm);

  let segment = 1;
  return targets.map((target) => {
    while (segment < cumulative.length - 1 && cumulative[segment] < target) segment += 1;
    const startDistance = cumulative[segment - 1];
    const segmentDistance = cumulative[segment] - startDistance;
    const ratio = segmentDistance > 0 ? (target - startDistance) / segmentDistance : 0;
    return { point: interpolate(route[segment - 1], route[segment], ratio), distanceAlongKm: target };
  });
}

function placeKey(location: WalkLocation) {
  return [location.suburbName, location.region, location.postcode]
    .map((value) => value?.trim().toLocaleLowerCase("en-AU") ?? "")
    .join("|");
}

export function summarizeRoutePlaces(samples: LocatedRoutePlaceSample[]): WalkPlace[] {
  if (!samples.length) return [];
  const ordered = [...samples].sort((a, b) => a.distanceAlongKm - b.distanceAlongKm);
  const totalKm = ordered[ordered.length - 1].distanceAlongKm;
  const grouped = new Map<string, WalkPlace & {
    latitudeWeight: number;
    longitudeWeight: number;
    coordinateWeight: number;
  }>();

  ordered.forEach((sample, index) => {
    const name = sample.location.suburbName?.trim();
    if (!name) return;

    const leftBoundary = index === 0
      ? 0
      : (ordered[index - 1].distanceAlongKm + sample.distanceAlongKm) / 2;
    const rightBoundary = index === ordered.length - 1
      ? totalKm
      : (sample.distanceAlongKm + ordered[index + 1].distanceAlongKm) / 2;
    const distanceMeters = Math.max(0, (rightBoundary - leftBoundary) * 1000);
    const coordinateWeight = distanceMeters || 1;
    const key = placeKey(sample.location);
    const existing = grouped.get(key);

    if (existing) {
      existing.distanceMeters += distanceMeters;
      existing.latitudeWeight += sample.point.latitude * coordinateWeight;
      existing.longitudeWeight += sample.point.longitude * coordinateWeight;
      existing.coordinateWeight += coordinateWeight;
      existing.latitude = existing.latitudeWeight / existing.coordinateWeight;
      existing.longitude = existing.longitudeWeight / existing.coordinateWeight;
      return;
    }

    grouped.set(key, {
      key,
      suburbName: name,
      region: sample.location.region,
      postcode: sample.location.postcode,
      countryCode: sample.location.countryCode,
      latitude: sample.point.latitude,
      longitude: sample.point.longitude,
      distanceMeters,
      visitOrder: index,
      latitudeWeight: sample.point.latitude * coordinateWeight,
      longitudeWeight: sample.point.longitude * coordinateWeight,
      coordinateWeight,
    });
  });

  const all = [...grouped.values()].sort((a, b) => a.visitOrder - b.visitOrder);
  const meaningful = all.filter((place) => place.distanceMeters >= MIN_MEANINGFUL_PLACE_KM * 1000);
  const selected = meaningful.length
    ? meaningful
    : [...all].sort((a, b) => b.distanceMeters - a.distanceMeters).slice(0, 1);

  return selected.map(({ latitudeWeight: _latitudeWeight, longitudeWeight: _longitudeWeight, coordinateWeight: _coordinateWeight, ...place }) => ({
    ...place,
    distanceMeters: Math.round(place.distanceMeters),
  }));
}
