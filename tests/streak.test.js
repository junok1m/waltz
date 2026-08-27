const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateWalkStreak } = require("../.test-build/utils/streak.js");

function walk(endedAt) {
  return { ended_at: endedAt };
}

test("streak counts consecutive days including today", () => {
  const now = new Date("2026-08-27T12:00:00");
  const walks = [
    walk("2026-08-27T08:00:00"),
    walk("2026-08-26T08:00:00"),
    walk("2026-08-25T08:00:00"),
    walk("2026-08-25T18:00:00"),
  ];
  assert.equal(calculateWalkStreak(walks, now), 3);
});

test("streak stays alive when latest walk was yesterday", () => {
  const now = new Date("2026-08-27T12:00:00");
  assert.equal(calculateWalkStreak([
    walk("2026-08-26T08:00:00"),
    walk("2026-08-25T08:00:00"),
  ], now), 2);
});

test("streak breaks after a missed full day", () => {
  const now = new Date("2026-08-27T12:00:00");
  assert.equal(calculateWalkStreak([walk("2026-08-24T08:00:00")], now), 0);
});
