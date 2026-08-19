export type Point = {
  latitude: number;
  longitude: number;
};

export type WalkTag = "trail" | "swim" | "coffee";

export type Walk = {
  id: number;
  dog_id?: string | null;
  dog_name: string;
  title?: string | null;
  distance_km: number;
  duration_seconds: number;
  ended_at: string;
  route_points?: Point[] | null;
  share_route?: boolean;
  hidden_from_profile?: boolean;
  tags?: WalkTag[] | null;
  is_mock?: boolean;
};
