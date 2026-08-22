import { Point, RoutePrivacy } from "../types/walk";
import { getDistanceInKm } from "./distance";

const MIN_ROUTE_FOR_HIDDEN_ENDS_KM = 1;
const HIDDEN_END_DISTANCE_KM = 0.2;

export function publicRouteForPrivacy(points: Point[], privacy: RoutePrivacy): Point[] {
  if (privacy === "private" || privacy === "stats_only") return [];
  if (privacy === "full") return points;
  if (routeDistance(points) < MIN_ROUTE_FOR_HIDDEN_ENDS_KM) return [];

  const startIndex = indexAfterDistance(points, HIDDEN_END_DISTANCE_KM);
  const reversedEndIndex = indexAfterDistance([...points].reverse(), HIDDEN_END_DISTANCE_KM);
  const endIndex = points.length - 1 - reversedEndIndex;
  if (startIndex >= endIndex) return [];
  return points.slice(startIndex, endIndex + 1);
}

export function hiddenEndsWillShowMap(points: Point[]) {
  return publicRouteForPrivacy(points, "hidden_ends").length > 1;
}

function routeDistance(points: Point[]) {
  let distance = 0;
  for (let index = 1; index < points.length; index += 1) {
    distance += getDistanceInKm(points[index - 1], points[index]);
  }
  return distance;
}

function indexAfterDistance(points: Point[], targetKm: number) {
  let distance = 0;
  for (let index = 1; index < points.length; index += 1) {
    distance += getDistanceInKm(points[index - 1], points[index]);
    if (distance >= targetKm) return index;
  }
  return points.length - 1;
}
