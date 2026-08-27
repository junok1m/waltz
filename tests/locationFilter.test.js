const test = require("node:test");
const assert = require("node:assert/strict");
const { evaluateLocationSample } = require("../.test-build/utils/locationFilter.js");
const { getDistanceInKm } = require("../.test-build/utils/distance.js");

function sample(latitude, timestamp, accuracy = 5, speed = null) {
  return { latitude, longitude: 151.2, timestamp, accuracy, speed };
}

test("distance returns zero for identical points and sensible short distance", () => {
  const a = { latitude: -33.8, longitude: 151.2 };
  assert.equal(getDistanceInKm(a, a), 0);
  const km = getDistanceInKm(a, { latitude: -33.799, longitude: 151.2 });
  assert.ok(km > 0.1 && km < 0.12);
});

test("location filter accepts first good point", () => {
  const result = evaluateLocationSample(null, sample(-33.8, 1000));
  assert.equal(result.accepted, true);
  assert.equal(result.reason, "first-point");
});

test("location filter rejects inaccurate, tiny, and impossible jumps", () => {
  assert.equal(evaluateLocationSample(null, sample(-33.8, 1000, 100)).reason, "inaccurate");

  const previous = sample(-33.8, 1000);
  assert.equal(evaluateLocationSample(previous, sample(-33.79999, 6000)).reason, "too-close");
  assert.equal(evaluateLocationSample(previous, sample(-33.79, 2000)).reason, "too-fast");
});

test("location filter accepts plausible walking movement", () => {
  const previous = sample(-33.8, 1000);
  const result = evaluateLocationSample(previous, sample(-33.7999, 6000));
  assert.equal(result.accepted, true);
  assert.equal(result.reason, "accepted");
  assert.ok(result.distanceKm > 0);
});
