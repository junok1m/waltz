import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { PartyPopper } from "@sketchyicons/react-native";
import { Point } from "../types/walk";
import { formatTime } from "../utils/time";

type Props = {
  seconds: number;
  distance: number;
  points: Point[];
  dogName: string;
  shareRoute: boolean;
  onShareRouteChange: (share: boolean) => void;
  onSave: () => void;
  onDiscard: () => void;
};

export function WalkCompleteScreen({
  seconds,
  distance,
  points,
  dogName,
  shareRoute,
  onShareRouteChange,
  onSave,
  onDiscard,
}: Props) {
  const mapRef = useRef<MapView | null>(null);
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  useEffect(() => {
    if (points.length < 2) return;
    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(points, {
        edgePadding: { top: 45, right: 45, bottom: 45, left: 45 },
        animated: false,
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [points]);

  return (
    <View style={styles.screen}>
      <View style={styles.titleRow}>
        <Text style={styles.complete}>Walk complete!</Text>
        <PartyPopper size={28} strokeWidth={2} color="#E87859" />
      </View>

      <View style={styles.metricsRow}>
        <View>
          <Text style={styles.metricLabel}>DISTANCE</Text>
          <Text style={styles.resultDistance}>{distance.toFixed(2)} km</Text>
        </View>
        <View>
          <Text style={styles.metricLabel}>TIME</Text>
          <Text style={styles.resultTime}>{formatTime(seconds)}</Text>
        </View>
      </View>

      <Text style={styles.message}>{dogName} did a waltz</Text>

      <View style={styles.mapWrap}>
        {lastPoint ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={{
              latitude: lastPoint.latitude,
              longitude: lastPoint.longitude,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            }}
            onMapReady={() => {
              if (points.length > 1) {
                mapRef.current?.fitToCoordinates(points, {
                  edgePadding: { top: 45, right: 45, bottom: 45, left: 45 },
                  animated: false,
                });
              }
            }}
          >
            {points.length > 1 ? <Polyline coordinates={points} strokeWidth={5} /> : null}
            {firstPoint ? <Marker coordinate={firstPoint} title="Start" /> : null}
            <Marker coordinate={lastPoint} title="Finish" />
          </MapView>
        ) : (
          <View style={styles.noRoute}><Text style={styles.noRouteText}>No route points recorded for this walk.</Text></View>
        )}
      </View>

      <View style={styles.shareCard}>
        <View style={styles.shareCopyWrap}>
          <Text style={styles.shareTitle}>Share this route?</Text>
          <Text style={styles.shareCopy}>Your choice from the start of the walk is remembered here. Only the finished route is shared, never your live location.</Text>
        </View>
        <View style={styles.shareChoice}>
          <Text style={[styles.choiceLabel, !shareRoute && styles.choiceActive]}>No</Text>
          <Switch value={shareRoute} onValueChange={onShareRouteChange} />
          <Text style={[styles.choiceLabel, shareRoute && styles.choiceActive]}>Yes</Text>
        </View>
      </View>

      <Pressable style={styles.button} onPress={onSave}>
        <Text style={styles.buttonText}>SAVE WALK</Text>
      </Pressable>
      <Pressable onPress={onDiscard}>
        <Text style={styles.discard}>Discard</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, gap: 14 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  complete: { fontFamily: "Schoolbell_400Regular", fontSize: 32, color: "#25211D" },
  metricsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  metricLabel: { fontSize: 10, color: "#756B60", fontWeight: "800", marginBottom: 3 },
  resultDistance: { fontSize: 36, fontWeight: "800", color: "#1D1A17" },
  resultTime: { fontSize: 28, fontWeight: "800", color: "#1D1A17" },
  message: { fontSize: 17, fontWeight: "700", color: "#4E473F" },
  mapWrap: { flex: 1, minHeight: 260, borderRadius: 24, overflow: "hidden", backgroundColor: "#EFE8DC" },
  noRoute: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  noRouteText: { color: "#756B60", textAlign: "center" },
  shareCard: { backgroundColor: "#FFFDF8", borderRadius: 20, padding: 15, gap: 12 },
  shareCopyWrap: { gap: 3 },
  shareTitle: { fontSize: 16, fontWeight: "800", color: "#1D1A17" },
  shareCopy: { fontSize: 12, lineHeight: 17, color: "#756B60" },
  shareChoice: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8 },
  choiceLabel: { fontSize: 12, color: "#9A9187", fontWeight: "700" },
  choiceActive: { color: "#596442" },
  button: { backgroundColor: "#8C9670", paddingVertical: 17, borderRadius: 999, alignItems: "center" },
  buttonText: { color: "#FFFDF8", fontFamily: "Schoolbell_400Regular", fontSize: 24, letterSpacing: 1.2 },
  discard: { fontSize: 15, textAlign: "center", color: "#756B60", textDecorationLine: "underline", paddingVertical: 4 },
});
