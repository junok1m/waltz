import { Point } from "../types/walk";
import { getDistanceInKm } from "./distance";

export type LocationSample = Point & {
  accuracy: number | null;
  speed: number | null;
  timestamp: number;
};

export type LocationDecision = {
  accepted: boolean;
  distanceKm: number;
  reason: "accepted" | "first-point" | "invalid" | "inaccurate" | "too-close" | "too-fast";
};

export const MAX_LOCATION_ACCURACY_METERS = 35;
export const MAX_WALK_SPEED_METERS_PER_SECOND = 6;

export function evaluateLocationSample(previous: LocationSample | null, sample: LocationSample): LocationDecision {
  if (!isValidSample(sample)) return rejected("invalid");
  if (sample.accuracy !== null && sample.accuracy > MAX_LOCATION_ACCURACY_METERS) return rejected("inaccurate");
  if (!previous) return { accepted: true, distanceKm: 0, reason: "first-point" };

  const elapsedSeconds = (sample.timestamp - previous.timestamp) / 1000;
  if (elapsedSeconds <= 0) return rejected("invalid");

  const distanceKm = getDistanceInKm(previous, sample);
  const distanceMeters = distanceKm * 1000;
  const calculatedSpeed = distanceMeters / elapsedSeconds;
  const reportedSpeed = sample.speed !== null && sample.speed >= 0 ? sample.speed : null;

  if (calculatedSpeed > MAX_WALK_SPEED_METERS_PER_SECOND || (reportedSpeed !== null && reportedSpeed > MAX_WALK_SPEED_METERS_PER_SECOND)) {
    return rejected("too-fast");
  }

  const uncertainty = Math.max(previous.accuracy ?? 0, sample.accuracy ?? 0);
  const minimumMovement = Math.max(3, Math.min(8, uncertainty * 0.35));
  if (distanceMeters < minimumMovement) return rejected("too-close");

  return { accepted: true, distanceKm, reason: "accepted" };
}

function isValidSample(sample: LocationSample) {
  return Number.isFinite(sample.latitude)
    && Number.isFinite(sample.longitude)
    && Number.isFinite(sample.timestamp)
    && sample.latitude >= -90
    && sample.latitude <= 90
    && sample.longitude >= -180
    && sample.longitude <= 180;
}

function rejected(reason: Exclude<LocationDecision["reason"], "accepted" | "first-point">): LocationDecision {
  return { accepted: false, distanceKm: 0, reason };
}
