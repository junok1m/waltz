export type ActivityEventType =
  | "boop_received"
  | "badge_earned"
  | "shared_walk"
  | "area_unlocked"
  | "local_legend"
  | "challenge_complete"
  | "ranking_climbed";

export type ActivityEvent = {
  id: number;
  dog_id: string;
  event_type: ActivityEventType;
  actor_dog_id: string | null;
  actor_name: string | null;
  walk_id: number | null;
  badge_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};
