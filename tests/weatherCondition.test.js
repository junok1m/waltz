const test = require("node:test");
const assert = require("node:assert/strict");
const { conditionFromCode, conditionWithPrecipitation } = require("../.test-build/utils/weatherCondition.js");

test("maps representative WMO codes", () => {
  assert.equal(conditionFromCode(0), "clear");
  assert.equal(conditionFromCode(3), "cloudy");
  assert.equal(conditionFromCode(53), "drizzle");
  assert.equal(conditionFromCode(63), "rain");
  assert.equal(conditionFromCode(82), "heavy_rain");
  assert.equal(conditionFromCode(95), "storm");
  assert.equal(conditionFromCode(999), "unknown");
});

test("liquid precipitation upgrades cloudy to drizzle or rain", () => {
  assert.equal(conditionWithPrecipitation(3, 0.1, 0, 0), "drizzle");
  assert.equal(conditionWithPrecipitation(3, 0.6, 0, 0), "rain");
});

test("severe coded conditions are preserved", () => {
  assert.equal(conditionWithPrecipitation(95, 0, 0, 0), "storm");
  assert.equal(conditionWithPrecipitation(75, 0, 0, 0), "snow");
  assert.equal(conditionWithPrecipitation(82, 0, 0, 0), "heavy_rain");
});
