const roadWidth = ["interpolate", ["linear"], ["zoom"], 8, 0.45, 12, 1.2, 16, 4.5];
const mainRoadWidth = ["interpolate", ["linear"], ["zoom"], 6, 0.7, 12, 2.2, 16, 7];

export const WALTZ_MAP_STYLE = JSON.stringify({
  version: 8,
  name: "Waltz Paper Map",
  glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
  sources: {
    streets: { type: "vector", url: "mapbox://mapbox.mapbox-streets-v8" },
  },
  layers: [
    { id: "paper", type: "background", paint: { "background-color": "#F8F3E9" } },
    { id: "soft-land", type: "fill", source: "streets", "source-layer": "landuse", filter: ["in", ["get", "class"], ["literal", ["residential", "school", "hospital", "commercial_area"]]], paint: { "fill-color": "#F4EEE4", "fill-opacity": 0.72 } },
    { id: "parks", type: "fill", source: "streets", "source-layer": "landuse", filter: ["in", ["get", "class"], ["literal", ["park", "grass", "wood", "scrub", "pitch"]]], paint: { "fill-color": "#E4E8D7", "fill-opacity": 0.92 } },
    { id: "park-overlays", type: "fill", source: "streets", "source-layer": "landuse_overlay", paint: { "fill-color": "#DDE4D2", "fill-opacity": 0.72 } },
    { id: "waterways", type: "line", source: "streets", "source-layer": "waterway", paint: { "line-color": "#CDDCD9", "line-width": ["interpolate", ["linear"], ["zoom"], 7, 0.5, 15, 2.4] } },
    { id: "water", type: "fill", source: "streets", "source-layer": "water", paint: { "fill-color": "#DCE6E3" } },
    { id: "buildings", type: "fill", source: "streets", "source-layer": "building", minzoom: 13, paint: { "fill-color": "#EAE3D8", "fill-outline-color": "#DDD5C9", "fill-opacity": 0.75 } },
    { id: "road-casing", type: "line", source: "streets", "source-layer": "road", filter: ["==", ["geometry-type"], "LineString"], paint: { "line-color": "#DED7CC", "line-width": ["+", roadWidth, 1.3], "line-opacity": 0.7 } },
    { id: "roads", type: "line", source: "streets", "source-layer": "road", filter: ["==", ["geometry-type"], "LineString"], paint: { "line-color": "#FFFDF8", "line-width": roadWidth, "line-opacity": 0.96 } },
    { id: "main-road-casing", type: "line", source: "streets", "source-layer": "road", filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk", "primary", "secondary"]]], paint: { "line-color": "#D4CCC0", "line-width": ["+", mainRoadWidth, 1.6], "line-opacity": 0.72 } },
    { id: "main-roads", type: "line", source: "streets", "source-layer": "road", filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk", "primary", "secondary"]]], paint: { "line-color": "#FAF5EB", "line-width": mainRoadWidth } },
    { id: "boundaries", type: "line", source: "streets", "source-layer": "admin", filter: ["==", ["get", "maritime"], "false"], paint: { "line-color": "#BDB5A9", "line-width": 0.7, "line-dasharray": [3, 3], "line-opacity": 0.45 } },
    { id: "suburb-labels", type: "symbol", source: "streets", "source-layer": "place_label", minzoom: 8, filter: ["in", ["get", "class"], ["literal", ["settlement", "settlement_subdivision"]]], layout: { "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]], "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"], "text-size": ["interpolate", ["linear"], ["zoom"], 8, 11, 14, 15], "text-letter-spacing": 0.04, "text-max-width": 8 }, paint: { "text-color": "#6F675E", "text-halo-color": "#F8F3E9", "text-halo-width": 1.4, "text-opacity": 0.9 } },
    { id: "road-labels", type: "symbol", source: "streets", "source-layer": "road", minzoom: 13.5, filter: ["all", ["==", ["geometry-type"], "LineString"], ["has", "name"]], layout: { "symbol-placement": "line", "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]], "text-font": ["DIN Pro Regular", "Arial Unicode MS Regular"], "text-size": 10, "text-letter-spacing": 0.02, "text-max-angle": 30 }, paint: { "text-color": "#91887E", "text-halo-color": "#FFFDF8", "text-halo-width": 1.2, "text-opacity": 0.82 } },
  ],
});
