import { supabase } from "../lib/supabase";
import { DogBadge } from "../types/badge";
import { Walk, WalkTag } from "../types/walk";
import { calculateWalkStreak } from "../utils/streak";

export const BADGE_IDS = ["keep-flame","tiny-adventures","trail","gone-fishing","coffee-stop","early-bird","night-shift","mileage-10","mileage-100","mileage-500","mileage-1000"] as const;

export function earnedBadgeIds(walks: Walk[]) {
  const distance = walks.reduce((sum, walk) => sum + walk.distance_km, 0);
  const streak = calculateWalkStreak(walks);
  const countTag = (tag: WalkTag) => walks.filter((walk) => walk.tags?.includes(tag)).length;
  const early = walks.filter((walk) => new Date(walk.ended_at).getHours() < 8).length;
  const night = walks.filter((walk) => new Date(walk.ended_at).getHours() >= 20).length;
  const ids: string[] = [];
  if (streak >= 7) ids.push("keep-flame");
  if (walks.length >= 10) ids.push("tiny-adventures");
  if (countTag("trail") >= 5) ids.push("trail");
  if (countTag("swim") >= 5) ids.push("gone-fishing");
  if (countTag("coffee") >= 10) ids.push("coffee-stop");
  if (early >= 3) ids.push("early-bird");
  if (night >= 3) ids.push("night-shift");
  for (const km of [10,100,500,1000]) if (distance >= km) ids.push(`mileage-${km}`);
  return ids;
}

export async function fetchDogBadges(dogId: string): Promise<DogBadge[]> {
  const { data, error } = await supabase.from("dog_badges").select("*").eq("dog_id", dogId).order("earned_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function syncDogBadges(dogId: string, walks: Walk[]) {
  const ids = earnedBadgeIds(walks);
  if (!ids.length) return [];
  const { data, error } = await supabase.from("dog_badges").upsert(ids.map((badge_id) => ({ dog_id: dogId, badge_id })), { onConflict: "dog_id,badge_id", ignoreDuplicates: true }).select("*");
  if (error) throw error;
  return data ?? [];
}
