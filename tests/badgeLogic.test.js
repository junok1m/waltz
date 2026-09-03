const test = require("node:test");
const assert = require("node:assert/strict");
const { badgeType, badgePeriodKey, earnedBadgeIds } = require("../.test-build/utils/badgeLogic.js");
const { profileStamps } = require("../.test-build/utils/profileStamps.js");

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
  assert.equal(badgePeriodKey("mileage-10", new Date("2026-08-15T12:00:00")), "2026-08");
  assert.equal(badgePeriodKey("limited-summer", new Date("2026-08-15T12:00:00")), "permanent");
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
  assert.equal(ids.includes("mileage-30"), false);
});

test("previous-month walks do not count toward monthly badges or mileage", () => {
  const now = new Date("2026-09-03T12:00:00+10:00");
  const walks = [
    ...Array.from({ length: 10 }, (_, i) => walk({
      endedAt: `2026-08-${String(20 + i).padStart(2, "0")}T06:30:00+10:00`,
      distance: 5,
      tags: ["trail"],
    })),
    walk({ endedAt: "2026-09-02T09:00:00+10:00", distance: 0.8 }),
  ];

  const ids = earnedBadgeIds(walks, now);
  assert.deepEqual(ids, []);
});

test("profile stamps show each lifetime design only once", () => {
  const badges = [
    { id: 2, badge_id: "night-shift", earned_at: "2026-09-03T00:00:00Z" },
    { id: 1, badge_id: "night-shift", earned_at: "2026-08-03T00:00:00Z" },
    { id: 3, badge_id: "early-bird", earned_at: "2026-08-02T00:00:00Z" },
  ];
  assert.deepEqual(profileStamps(badges).map((badge) => badge.id), [2, 3]);
});
