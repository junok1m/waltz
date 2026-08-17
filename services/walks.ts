import { supabase } from "../lib/supabase";
import { Walk } from "../types/walk";

export async function fetchWalks(): Promise<Walk[]> {
  const { data, error } = await supabase
    .from("walks")
    .select("*")
    .order("ended_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createWalk(input: {
  userId: string;
  dogId: string;
  dogName: string;
  distanceKm: number;
  durationSeconds: number;
}) {
  const { data: walk, error: walkError } = await supabase
    .from("walks")
    .insert({
      user_id: input.userId,
      dog_name: input.dogName,
      distance_km: input.distanceKm,
      duration_seconds: input.durationSeconds,
      ended_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (walkError) throw walkError;

  const { error: dogLinkError } = await supabase.from("walk_dogs").insert({
    walk_id: walk.id,
    dog_id: input.dogId,
  });

  if (dogLinkError) {
    // Avoid leaving an orphaned walk row if the dog link fails.
    await supabase.from("walks").delete().eq("id", walk.id);
    throw dogLinkError;
  }

  return walk;
}
