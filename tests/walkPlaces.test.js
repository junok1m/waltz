const test = require("node:test");
const assert = require("node:assert/strict");
const {
  MAX_PLACE_SAMPLES,
  sampleRouteForPlaces,
  summarizeRoutePlaces,
} = require("../.test-build/utils/walkPlaces.js");

function point(longitude) {
  return { latitude: -33.84, longitude };
}

function location(suburbName, longitude) {
  return {
    suburbName,
    region: "NSW",
    postcode: suburbName === "Rhodes" ? "2138" : "2127",
    countryCode: "AU",
    latitude: -33.84,
    longitude,
  };
}

test("route sampling includes both ends without flooding the geocoder", () => {
  const route = Array.from({ length: 101 }, (_, index) => point(151.08 + index * 0.0005));
  const samples = sampleRouteForPlaces(route);
  assert.deepEqual(samples[0].point, route[0]);
  assert.deepEqual(samples.at(-1).point, route.at(-1));
  assert.ok(samples.length > 2);
  assert.ok(samples.length <= MAX_PLACE_SAMPLES);
});

test("a cross-suburb walk records every meaningfully visited place once", () => {
  const samples = [
    { point: point(151.08), distanceAlongKm: 0, location: location("Rhodes", 151.08) },
    { point: point(151.082), distanceAlongKm: 0.3, location: location("Rhodes", 151.082) },
    { point: point(151.084), distanceAlongKm: 0.6, location: location("Rhodes", 151.084) },
    { point: point(151.086), distanceAlongKm: 0.9, location: location("Sydney Olympic Park", 151.086) },
    { point: point(151.088), distanceAlongKm: 1.2, location: location("Sydney Olympic Park", 151.088) },
  ];

  const places = summarizeRoutePlaces(samples);
  assert.deepEqual(places.map((place) => place.suburbName), ["Rhodes", "Sydney Olympic Park"]);
  assert.equal(places[0].distanceMeters, 750);
  assert.equal(places[1].distanceMeters, 450);
});

test("a boundary-only geocode is ignored", () => {
  const samples = [
    { point: point(151.08), distanceAlongKm: 0, location: location("Rhodes", 151.08) },
    { point: point(151.082), distanceAlongKm: 0.3, location: location("Rhodes", 151.082) },
    { point: point(151.084), distanceAlongKm: 0.6, location: location("Rhodes", 151.084) },
    { point: point(151.086), distanceAlongKm: 0.9, location: location("Liberty Grove", 151.086) },
  ];

  assert.deepEqual(summarizeRoutePlaces(samples).map((place) => place.suburbName), ["Rhodes"]);
});
