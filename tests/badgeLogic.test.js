const test = require("node:test");
const assert = require("node:assert/strict");
const { badgeType, badgePeriodKey, earnedBadgeIds } = require("../.test-build/utils/badgeLogic.js");

function walk({ endedAt, distance = 1, tags = [] }) {
  return {
    id: 1,
    dog_name: "Test dog",
    distance_km: distance,
    duration_seconds: 600,
    ended_at: endedAt,
    tags,
  };
}

test("badge types and period keys stay separated", () => {
  assert.equal(badgeType("trail"), "monthly");
  assert.equal(badgeType("mileage-100"), "mileage");
  assert.equal(badgeType("limited-summer"), "limited");
  assert.equal(badgePeriodKey("mileage-100", new Date("2026-08-15T12:00:00")), "permanent");
});

test("badge calculation awards monthly and mileage milestones", () => {
  const now = new Date("2026-08-15T12:00:00");
  const walks = Array.from({ length: 10 }, (_, i) => walk({
    endedAt: `2026-08-${String(15 - i).padStart(2, "0")}T06:30:00`,
    distance: 1,
    tags: i < 5 ? ["trail"] : [],
  }));

  const ids = earnedBadgeIds(walks, now);
  assert.ok(ids.includes("keep-flame"));
  assert.ok(ids.includes("tiny-adventures"));
  assert.ok(ids.includes("trail"));
  assert.ok(ids.includes("early-bird"));
  assert.ok(ids.includes("mileage-10"));
  assert.equal(ids.includes("mileage-100"), false);
});
