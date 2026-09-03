import { supabase } from "../lib/supabase";
import { ActivityEvent } from "../types/activity";

export async function fetchLatestActivityEvents(
  dogId: string,
  limit = 3,
): Promise<ActivityEvent[]> {
  const { data, error } = await supabase
    .from("activity_events")
    .select(
      "id,dog_id,event_type,actor_dog_id,walk_id,badge_id,metadata,created_at,actor:dogs!activity_events_actor_dog_id_fkey(name)",
    )
    .eq("dog_id", dogId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((event) => {
    const actorValue = event.actor as { name: string } | { name: string }[] | null;
    const actor = Array.isArray(actorValue) ? actorValue[0] : actorValue;
    return {
      id: event.id,
      dog_id: event.dog_id,
      event_type: event.event_type,
      actor_dog_id: event.actor_dog_id,
      actor_name: actor?.name ?? null,
      walk_id: event.walk_id,
      badge_id: event.badge_id,
      metadata: event.metadata ?? {},
      created_at: event.created_at,
    } as ActivityEvent;
  });
}

export async function fetchDogRankingEvents(dogId: string): Promise<ActivityEvent[]> {
  const { data, error } = await supabase
    .from("activity_events")
    .select("id,dog_id,event_type,actor_dog_id,walk_id,badge_id,metadata,created_at")
    .eq("dog_id", dogId)
    .eq("event_type", "ranking_climbed")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data ?? []).map((event) => ({
    ...event,
    actor_name: null,
    metadata: event.metadata ?? {},
  })) as ActivityEvent[];
}
