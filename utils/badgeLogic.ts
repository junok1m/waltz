import type { BadgeType } from "../types/badge";
import type { Walk, WalkTag } from "../types/walk";
import { calculateWalkStreak } from "./streak";

export const BADGE_IDS = ["keep-flame","tiny-adventures","trail","gone-fishing","coffee-stop","early-bird","night-shift","mileage-1","mileage-10","mileage-30","mileage-50"] as const;

export function monthKey(date: Date | string = new Date()) {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
  }).format(value);
}

export function badgeType(badgeId: string): BadgeType {
  if (badgeId.startsWith("mileage-")) return "mileage";
  if (badgeId.startsWith("limited-")) return "limited";
  return "monthly";
}

export function badgePeriodKey(badgeId: string, date: Date | string = new Date()) {
  return badgeType(badgeId) === "limited" ? "permanent" : monthKey(date);
}

export function earnedBadgeIds(walks: Walk[], now = new Date()) {
  const activeMonth = monthKey(now);
  const monthlyWalks = walks.filter((walk) => monthKey(walk.ended_at) === activeMonth);
  const distance = monthlyWalks.reduce((sum, walk) => sum + walk.distance_km, 0);
  const streak = calculateWalkStreak(monthlyWalks, now);
  const countTag = (tag: WalkTag) => monthlyWalks.filter((walk) => walk.tags?.includes(tag)).length;
  const early = monthlyWalks.filter((walk) => new Date(walk.ended_at).getHours() < 8).length;
  const night = monthlyWalks.filter((walk) => new Date(walk.ended_at).getHours() >= 20).length;
  const ids: string[] = [];

  if (streak >= 7) ids.push("keep-flame");
  if (monthlyWalks.length >= 10) ids.push("tiny-adventures");
  if (countTag("trail") >= 5) ids.push("trail");
  if (countTag("swim") >= 5) ids.push("gone-fishing");
  if (countTag("coffee") >= 10) ids.push("coffee-stop");
  if (early >= 3) ids.push("early-bird");
  if (night >= 3) ids.push("night-shift");

  for (const km of [1, 10, 30, 50]) {
    if (distance >= km) ids.push(`mileage-${km}`);
  }

  return ids;
}
