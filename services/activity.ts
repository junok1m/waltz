import { supabase } from "../lib/supabase";
import { ActivityEvent } from "../types/activity";

export async function fetchLatestActivityEvents(
  dogId: string,
  limit = 3,
): Promise<ActivityEvent[]> {
  const { data, error } = await supabase
    .from("activity_events")
    .select(
      "id,dog_id,event_type,actor_dog_id,walk_id,badge_id,metadata,created_at",
    )
    .eq("dog_id", dogId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as ActivityEvent[];
}
