export type Point = {
  latitude: number;
  longitude: number;
};

export type WalkTag = "trail" | "swim" | "coffee";
export type RoutePrivacy = "private" | "hidden_ends" | "full" | "stats_only";

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
  route_visibility?: RoutePrivacy;
  hidden_from_profile?: boolean;
  tags?: WalkTag[] | null;
  is_mock?: boolean;
};
