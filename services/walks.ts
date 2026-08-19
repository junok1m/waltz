import { supabase } from "../lib/supabase";
import { Point, Walk, WalkTag } from "../types/walk";

export async function fetchWalks(): Promise<Walk[]> {
  const pageSize = 1000;
  const all: Walk[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("walks")
      .select("*")
      .order("ended_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    const page = data ?? [];
    all.push(...page);
    if (page.length < pageSize) break;
  }

  return all;
}

export async function createWalk(input: {
  userId: string;
  dogId: string;
  dogName: string;
  title: string;
  distanceKm: number;
  durationSeconds: number;
  routePoints: Point[];
  shareRoute: boolean;
  tags: WalkTag[];
}) {
  const { data: walk, error: walkError } = await supabase
    .from("walks")
    .insert({
      user_id: input.userId,
      dog_name: input.dogName,
      title: input.title.trim(),
      distance_km: input.distanceKm,
      duration_seconds: input.durationSeconds,
      route_points: input.routePoints,
      share_route: input.shareRoute,
      tags: input.tags,
      ended_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (walkError) throw walkError;
  const { error: dogLinkError } = await supabase.from("walk_dogs").insert({ walk_id: walk.id, dog_id: input.dogId });
  if (dogLinkError) { await supabase.from("walks").delete().eq("id", walk.id); throw dogLinkError; }
  return walk;
}
