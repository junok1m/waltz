import { supabase } from "../lib/supabase";

export type MonthlyDogRank = {
  rank: number;
  dog_id: string;
  dog_name: string;
  avatar_url: string | null;
  distance_km: number;
  walk_count: number;
};

export async function fetchMonthlyDogRanking(): Promise<MonthlyDogRank[]> {
  const { data, error } = await supabase.rpc("get_monthly_dog_ranking");
  if (error) throw error;

  return (data ?? []).map((row) => ({
    rank: Number(row.rank),
    dog_id: String(row.dog_id),
    dog_name: String(row.dog_name),
    avatar_url: row.avatar_url ? String(row.avatar_url) : null,
    distance_km: Number(row.distance_km),
    walk_count: Number(row.walk_count),
  }));
}
