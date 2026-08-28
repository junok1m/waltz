import { supabase } from "../lib/supabase";
import type { DogBadge } from "../types/badge";
import type { Dog } from "../types/dog";
import type { Walk } from "../types/walk";

export type PublicDogProfile = {
  dog: Dog;
  walks: Walk[];
  badges: DogBadge[];
};

export async function fetchPublicDogProfile(dogId: string): Promise<PublicDogProfile> {
  const [dogResult, walksResult, eventsResult] = await Promise.all([
    supabase.from("dogs").select("*").eq("id", dogId).single(),
    supabase
      .from("walks")
      .select("id,user_id,dog_name,title,distance_km,duration_seconds,ended_at,route_points,share_route,route_visibility,hidden_from_profile,tags,weather_temperature_c,weather_condition,weather_code,walk_dogs!inner(dog_id)")
      .eq("walk_dogs.dog_id", dogId)
      .eq("share_route", true)
      .eq("hidden_from_profile", false)
      .order("ended_at", { ascending: false })
      .limit(20),
    supabase
      .from("activity_events")
      .select("id,dog_id,badge_id,created_at")
      .eq("dog_id", dogId)
      .eq("event_type", "badge_earned")
      .not("badge_id", "is", null)
      .order("created_at", { ascending: false }),
  ]);

  if (dogResult.error) throw dogResult.error;
  if (walksResult.error) throw walksResult.error;
  if (eventsResult.error) throw eventsResult.error;

  const walks = (walksResult.data ?? []).map((walk) => ({
    ...walk,
    dog_id: dogId,
  })) as unknown as Walk[];
  const badges = (eventsResult.data ?? []).map((event) => ({
    id: event.id,
    dog_id: event.dog_id,
    badge_id: String(event.badge_id),
    badge_type: String(event.badge_id).startsWith("mileage-") ? "mileage" as const : "monthly" as const,
    period_key: String(event.badge_id).startsWith("mileage-") ? "permanent" : new Date(event.created_at).toISOString().slice(0, 7),
    earned_at: event.created_at,
  }));

  return { dog: dogResult.data as Dog, walks, badges };
}
