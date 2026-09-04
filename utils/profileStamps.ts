import type { DogBadge } from "../types/badge";

export function profileStamps(badges: DogBadge[]) {
  const seen = new Set<string>();
  return badges.filter((badge) => {
    if (badge.badge_id === "tiny-adventures") return false;
    if (seen.has(badge.badge_id)) return false;
    seen.add(badge.badge_id);
    return true;
  });
}
