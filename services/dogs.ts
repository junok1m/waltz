import { supabase } from "../lib/supabase";
import { Dog } from "../types/dog";

export async function fetchDogsForUser(userId: string): Promise<Dog[]> {
  const { data, error } = await supabase
    .from("dogs")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createDog(input: {
  ownerId: string;
  name: string;
  birthYear: number;
  birthMonth?: number | null;
  birthDay?: number | null;
  breed?: string | null;
}) {
  const { data, error } = await supabase
    .from("dogs")
    .insert({
      owner_id: input.ownerId,
      name: input.name.trim(),
      birth_year: input.birthYear,
      birth_month: input.birthMonth ?? null,
      birth_day: input.birthDay ?? null,
      breed: input.breed?.trim() || null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Dog;
}
