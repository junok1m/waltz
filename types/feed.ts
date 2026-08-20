import { Point, WalkTag } from "./walk";

export type FeedWalk = {
  id: number;
  user_id: string;
  dog_id: string;
  dog_name: string;
  dog_avatar_url: string | null;
  dog_breed: string | null;
  owner_id: string;
  title: string | null;
  distance_km: number;
  duration_seconds: number;
  ended_at: string;
  route_points: Point[];
  tags: WalkTag[];
  boop_count: number;
  booped_by_me: boolean;
};
