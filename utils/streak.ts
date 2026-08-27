import type { Walk } from "../types/walk";

function toLocalDateKey(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function dateKeyForOffset(daysFromToday: number, now: Date) {
  const date = new Date(now);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + daysFromToday);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function calculateWalkStreak(walks: Walk[], now = new Date()) {
  if (walks.length === 0) {
    return 0;
  }

  const walkedDays = new Set(walks.map((walk) => toLocalDateKey(walk.ended_at)));
  const today = dateKeyForOffset(0, now);
  const yesterday = dateKeyForOffset(-1, now);

  // A streak stays alive for the rest of today even before today's walk.
  // If neither today nor yesterday has a walk, the streak is broken.
  let offset = walkedDays.has(today) ? 0 : walkedDays.has(yesterday) ? -1 : null;

  if (offset === null) {
    return 0;
  }

  let streak = 0;

  while (walkedDays.has(dateKeyForOffset(offset, now))) {
    streak += 1;
    offset -= 1;
  }

  return streak;
}
