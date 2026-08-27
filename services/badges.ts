import { supabase } from "../lib/supabase";
import type { DogBadge } from "../types/badge";
import type { Walk } from "../types/walk";
import {
  BADGE_IDS,
  badgePeriodKey,
  badgeType,
  earnedBadgeIds,
  monthKey,
} from "../utils/badgeLogic";

export { BADGE_IDS, badgePeriodKey, badgeType, earnedBadgeIds, monthKey };

export async function fetchDogBadges(dogId: string): Promise<DogBadge[]> {
  const { data, error } = await supabase.from("dog_badges").select("*").eq("dog_id", dogId).order("earned_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function syncDogBadges(dogId: string, walks: Walk[]) {
  const ids = earnedBadgeIds(walks);
  if (!ids.length) return [];

  const { data, error } = await supabase.from("dog_badges").upsert(ids.map((badge_id) => ({
    dog_id: dogId,
    badge_id,
    badge_type: badgeType(badge_id),
    period_key: badgePeriodKey(badge_id),
  })), { onConflict: "dog_id,badge_id,period_key", ignoreDuplicates: true }).select("*");

  if (error) throw error;
  return data ?? [];
}
