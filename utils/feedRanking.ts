import { FeedItem } from "../types/feed";
import { Point, Walk } from "../types/walk";
import { getDistanceInKm } from "./distance";

const HOUR_MS = 60 * 60 * 1000;

export function hasFeedLocationAnchor(viewerWalks: Walk[]) {
  return latestWalkAnchor(viewerWalks) !== null;
}

export function rankFeedItemsForViewer(items: FeedItem[], viewerWalks: Walk[]) {
  const anchor = latestWalkAnchor(viewerWalks);
  if (!anchor) return [...items];

  return [...items].sort((a, b) => {
    const scoreDifference = relevanceScore(b, anchor) - relevanceScore(a, anchor);
    if (scoreDifference) return scoreDifference;
    return itemTimestamp(b) - itemTimestamp(a) || itemKey(b).localeCompare(itemKey(a));
  });
}

function latestWalkAnchor(walks: Walk[]): Point | null {
  const latestWithRoute = walks
    .filter((walk) => (walk.route_points?.length ?? 0) > 0)
    .sort((a, b) => new Date(b.ended_at).getTime() - new Date(a.ended_at).getTime())[0];
  return latestWithRoute ? midpoint(latestWithRoute.route_points ?? []) : null;
}

function relevanceScore(item: FeedItem, anchor: Point) {
  const eventTime = itemTimestamp(item);
  if (item.kind !== "walk" || item.route_points.length === 0) return eventTime;
  const distanceKm = getDistanceInKm(anchor, midpoint(item.route_points));
  return eventTime - distancePenalty(distanceKm);
}

function distancePenalty(distanceKm: number) {
  if (distanceKm <= 5) return 0;
  if (distanceKm <= 15) return 4 * HOUR_MS;
  if (distanceKm <= 40) return 12 * HOUR_MS;
  return 24 * HOUR_MS;
}

function midpoint(points: Point[]) {
  return points[Math.floor(points.length / 2)];
}

function itemTimestamp(item: FeedItem) {
  return new Date(item.kind === "walk" ? item.ended_at : item.created_at).getTime();
}

function itemKey(item: FeedItem) {
  return `${item.kind}-${item.id}`;
}
