export type BadgeType = "monthly" | "mileage" | "limited";

export type DogBadge = {
  id: number;
  dog_id: string;
  badge_id: string;
  badge_type: BadgeType;
  period_key: string;
  earned_at: string;
};
