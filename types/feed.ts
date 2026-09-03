import { Point, WalkTag } from "./walk";

export type FeedWalk = {
  kind: "walk";
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

export type FeedBadgeEvent = {
  kind: "badge";
  id: number;
  dog_id: string;
  dog_name: string;
  owner_id: string;
  badge_id: string;
  created_at: string;
};

export type FeedRankingEvent = {
  kind: "ranking";
  id: number;
  dog_id: string;
  dog_name: string;
  dog_avatar_url: string | null;
  owner_id: string;
  old_rank: number | null;
  new_rank: number;
  distance_km: number;
  created_at: string;
};

export type FeedItem = FeedWalk | FeedBadgeEvent | FeedRankingEvent;
