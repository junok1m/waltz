import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import Mapbox from "@rnmapbox/maps";
import { WALTZ_MAP_STYLE } from "../styles/waltzMapStyle";

const MAPBOX_PUBLIC_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
if (MAPBOX_PUBLIC_TOKEN) Mapbox.setAccessToken(MAPBOX_PUBLIC_TOKEN);

export type PlaceMapPoint = {
  key: string;
  latitude: number;
  longitude: number;
};

type Props = {
  places: PlaceMapPoint[];
};

function cameraFor(places: PlaceMapPoint[]) {
  if (!places.length) return { center: [151.2093, -33.8688] as [number, number], zoom: 9.7 };

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;
  for (const place of places) {
    minLat = Math.min(minLat, place.latitude);
    maxLat = Math.max(maxLat, place.latitude);
    minLon = Math.min(minLon, place.longitude);
    maxLon = Math.max(maxLon, place.longitude);
  }

  const center: [number, number] = [(minLon + maxLon) / 2, (minLat + maxLat) / 2];
  const spread = Math.max(maxLat - minLat, maxLon - minLon);
  const zoom = places.length === 1
    ? 10.4
    : spread < 0.03
      ? 11.8
      : spread < 0.07
        ? 10.8
        : spread < 0.15
          ? 9.8
          : spread < 0.3
            ? 8.8
            : 7.8;

  return { center, zoom };
}

export function PlacesMap({ places }: Props) {
  const [layout, setLayout] = useState<{ width: number; height: number } | null>(null);
  const { center, zoom } = useMemo(() => cameraFor(places), [places]);

  return (
    <View
      style={styles.wrap}
      onLayout={({ nativeEvent: { layout: next } }) => {
        if (next.width > 1 && next.height > 1) {
          setLayout((current) => current && current.width === next.width && current.height === next.height ? current : { width: next.width, height: next.height });
        }
      }}
    >
      {layout ? (
        <Mapbox.MapView
          style={[StyleSheet.absoluteFill, { width: layout.width, height: layout.height }]}
          styleJSON={WALTZ_MAP_STYLE}
          logoEnabled={false}
          compassEnabled={false}
          scaleBarEnabled={false}
          attributionEnabled={false}
          scrollEnabled
          pitchEnabled={false}
          rotateEnabled={false}
          zoomEnabled
        >
          <Mapbox.Camera centerCoordinate={center} zoomLevel={zoom} animationDuration={0} />
          {places.map((place) => (
            <Mapbox.PointAnnotation key={place.key} id={`place-${place.key}`} coordinate={[place.longitude, place.latitude]}>
              <View style={styles.dotOuter}>
                <View style={styles.dot} />
              </View>
            </Mapbox.PointAnnotation>
          ))}
        </Mapbox.MapView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 285, borderRadius: 24, overflow: "hidden", backgroundColor: "#EFE8DC" },
  dotOuter: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#FFFDF8", alignItems: "center", justifyContent: "center" },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#78845C" },
});
