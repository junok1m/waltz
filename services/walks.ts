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
  dogName: string;
  distanceKm: number;
  durationSeconds: number;
}) {
  const { error } = await supabase.from("walks").insert({
    dog_name: input.dogName,
    distance_km: input.distanceKm,
    duration_seconds: input.durationSeconds,
    ended_at: new Date().toISOString(),
  });

  if (error) throw error;
}
