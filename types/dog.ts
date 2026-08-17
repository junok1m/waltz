export type Dog = {
  id: string;
  owner_id: string;
  name: string;
  birth_year: number;
  birth_month: number | null;
  birth_day: number | null;
  breed: string | null;
  sex: "male" | "female" | "unknown" | null;
  weight_kg: number | null;
  avatar_url: string | null;
  created_at: string;
};
