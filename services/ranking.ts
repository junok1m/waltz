import { supabase } from "../lib/supabase";

export type MonthlyDogRank = {
  dog_id: string;
  dog_name: string;
  avatar_url: string | null;
  distance_km: number;
  walk_count: number;
  places_count: number;
  distance_rank: number;
  waltzes_rank: number;
  places_rank: number;
};

export type RankingCategory = "distance" | "waltzes" | "places";

export async function fetchMonthlyDogRanking(): Promise<MonthlyDogRank[]> {
  const { data, error } = await supabase.rpc("get_monthly_dog_ranking");
  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => ({
    dog_id: String(row.dog_id),
    dog_name: String(row.dog_name),
    avatar_url: row.avatar_url ? String(row.avatar_url) : null,
    distance_km: Number(row.distance_km),
    walk_count: Number(row.walk_count),
    places_count: Number(row.places_count),
    distance_rank: Number(row.distance_rank),
    waltzes_rank: Number(row.waltzes_rank),
    places_rank: Number(row.places_rank),
  }));
}
