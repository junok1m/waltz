const test = require("node:test");
const assert = require("node:assert/strict");
const { publicRouteForPrivacy, hiddenEndsWillShowMap } = require("../.test-build/utils/routePrivacy.js");

const points = Array.from({ length: 8 }, (_, i) => ({ latitude: -33.8 + i * 0.002, longitude: 151.1 }));

test("private and stats-only routes never expose points", () => {
  assert.deepEqual(publicRouteForPrivacy(points, "private"), []);
  assert.deepEqual(publicRouteForPrivacy(points, "stats_only"), []);
});

test("full route preserves every point", () => {
  assert.deepEqual(publicRouteForPrivacy(points, "full"), points);
});

test("hidden ends removes both ends on a long route", () => {
  const visible = publicRouteForPrivacy(points, "hidden_ends");
  assert.ok(visible.length > 1);
  assert.ok(visible.length < points.length);
  assert.notDeepEqual(visible[0], points[0]);
  assert.notDeepEqual(visible.at(-1), points.at(-1));
  assert.equal(hiddenEndsWillShowMap(points), true);
});

test("hidden ends hides short routes completely", () => {
  const short = points.slice(0, 3);
  assert.deepEqual(publicRouteForPrivacy(short, "hidden_ends"), []);
  assert.equal(hiddenEndsWillShowMap(short), false);
});
