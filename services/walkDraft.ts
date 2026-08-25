import Storage from "expo-sqlite/kv-store";
import { Point, RoutePrivacy, WalkTag } from "../types/walk";
import { LocationSample } from "../utils/locationFilter";

const WALK_DRAFT_KEY = "waltz.active-walk.v1";

export type WalkDraft = {
  version: 1;
  userId: string;
  dogId: string;
  status: "walking" | "finished";
  startedAt: number;
  endedAt: number | null;
  distanceKm: number;
  points: Point[];
  lastSample: LocationSample | null;
  title: string;
  shareRoute: boolean;
  routePrivacy?: RoutePrivacy;
  tags: WalkTag[];
};

export async function loadWalkDraft(): Promise<WalkDraft | null> {
  const stored = await Storage.getItem(WALK_DRAFT_KEY);
  if (!stored) return null;

  try {
    const value: unknown = JSON.parse(stored);
    if (isWalkDraft(value)) return value;
  } catch (error) {
    console.warn("Couldn't read saved walk draft:", error);
  }

  await Storage.removeItem(WALK_DRAFT_KEY);
  return null;
}

export async function saveWalkDraft(draft: WalkDraft) {
  await Storage.setItem(WALK_DRAFT_KEY, JSON.stringify(draft));
}

export async function clearWalkDraft() {
  await Storage.removeItem(WALK_DRAFT_KEY);
}

function isWalkDraft(value: unknown): value is WalkDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<WalkDraft>;
  return draft.version === 1
    && typeof draft.userId === "string"
    && typeof draft.dogId === "string"
    && (draft.status === "walking" || draft.status === "finished")
    && isNonNegativeNumber(draft.startedAt)
    && (draft.endedAt === null || isNonNegativeNumber(draft.endedAt))
    && isNonNegativeNumber(draft.distanceKm)
    && Array.isArray(draft.points)
    && draft.points.every(isPoint)
    && (draft.lastSample === null || isLocationSample(draft.lastSample))
    && typeof draft.title === "string"
    && typeof draft.shareRoute === "boolean"
    && (draft.routePrivacy === undefined || draft.routePrivacy === "private" || draft.routePrivacy === "hidden_ends" || draft.routePrivacy === "full" || draft.routePrivacy === "stats_only")
    && Array.isArray(draft.tags)
    && draft.tags.every((tag) => tag === "trail" || tag === "swim" || tag === "coffee");
}

function isPoint(value: unknown): value is Point {
  if (!value || typeof value !== "object") return false;
  const point = value as Partial<Point>;
  return Number.isFinite(point.latitude)
    && Number.isFinite(point.longitude)
    && Number(point.latitude) >= -90
    && Number(point.latitude) <= 90
    && Number(point.longitude) >= -180
    && Number(point.longitude) <= 180;
}

function isLocationSample(value: unknown): value is LocationSample {
  if (!isPoint(value)) return false;
  const sample = value as Partial<LocationSample>;
  return (sample.accuracy === null || isNonNegativeNumber(sample.accuracy))
    && (sample.speed === null || typeof sample.speed === "number")
    && isNonNegativeNumber(sample.timestamp);
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
