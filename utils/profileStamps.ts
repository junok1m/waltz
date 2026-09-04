import type { DogBadge } from "../types/badge";

export type ProfileStamp = DogBadge & { count: number };

export function profileStamps(badges: DogBadge[]) {
  const stamps = new Map<string, ProfileStamp>();
  for (const badge of badges) {
    if (badge.badge_id === "tiny-adventures") continue;
    const existing = stamps.get(badge.badge_id);
    if (existing) existing.count += 1;
    else stamps.set(badge.badge_id, { ...badge, count: 1 });
  }
  return [...stamps.values()];
}
