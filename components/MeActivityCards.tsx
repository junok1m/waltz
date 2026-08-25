import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Bone, Maximize2, Ruler, Timer, X } from "@sketchyicons/react-native";
import { fetchBoopCountsByWalkIds } from "../services/boops";
import { DogBadge } from "../types/badge";
import { Walk } from "../types/walk";
import { BADGE_META, BadgeIcon } from "./BadgeIcon";
import { WaltzMap } from "./WaltzMap";

function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function fallbackWalkTitle(dateString: string) {
  const hour = new Date(dateString).getHours();
  if (hour < 12) return "Morning waltz";
  if (hour < 18) return "Afternoon waltz";
  return "Night waltz";
}

function badgeActivityMessage(dogName: string, badgeId: string) {
  const distance = badgeId.match(/^mileage-(\d+)$/)?.[1];
  if (distance) return `${dogName} completed ${Number(distance).toLocaleString()} km`;
  return `${dogName} got the ${BADGE_META[badgeId]?.title ?? badgeId.replaceAll("-", " ")} badge`;
}

export function MeBadgeActivityCard({ dogName, badge }: { dogName: string; badge: DogBadge }) {
  return (
    <View style={styles.badgeCard}>
      <BadgeIcon badgeId={badge.badge_id} size={52} showLabel={false} />
      <View style={styles.flex}>
        <Text style={styles.badgeMessage}>{badgeActivityMessage(dogName, badge.badge_id)}</Text>
        <Text style={styles.date}>{new Date(badge.earned_at).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}</Text>
      </View>
    </View>
  );
}

export function MeWalkActivityCard({ walk, onMenu }: { walk: Walk; onMenu: () => void }) {
  const points = walk.route_points ?? [];
  const [boopCount, setBoopCount] = useState(0);
  const [mapOpen, setMapOpen] = useState(false);
  const title = walk.title?.trim() || fallbackWalkTitle(walk.ended_at);
  const visibility = walk.route_visibility ?? (walk.share_route ? "full" : "private");
  const canShowMap = visibility !== "stats_only" && points.length > 0;
  const visibilityLabel = {
    private: "Only me",
    stats_only: "Stats only",
    hidden_ends: "Start & finish hidden",
    full: "Full route",
  }[visibility];

  useEffect(() => {
    let active = true;
    fetchBoopCountsByWalkIds([walk.id])
      .then((counts) => { if (active) setBoopCount(counts[walk.id] ?? 0); })
      .catch((error) => console.error("Load walk Boops error:", error));
    return () => { active = false; };
  }, [walk.id]);

  return (
    <View style={styles.walkCard}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.date}>{new Date(walk.ended_at).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}</Text>
            <Text style={styles.visibility}>{visibilityLabel}</Text>
          </View>
        </View>
        <Pressable style={styles.moreButton} onPress={onMenu} hitSlop={10}><Text style={styles.moreText}>•••</Text></Pressable>
      </View>
      {canShowMap ? (
        <Pressable style={styles.map} onPress={() => setMapOpen(true)} accessibilityRole="button" accessibilityLabel="Open route map">
          <WaltzMap points={points} interactive={false} overview />
          <View style={styles.expandIcon}><Maximize2 size={16} strokeWidth={2} color="#655D54" /></View>
        </Pressable>
      ) : null}
      <View style={styles.metrics}>
        <Metric icon={<Ruler size={17} strokeWidth={2} color="#78845C" />} value={`${walk.distance_km.toFixed(2)} km`} />
        <Metric icon={<Timer size={17} strokeWidth={2} color="#78845C" />} value={formatDuration(walk.duration_seconds)} />
        <Metric icon={<Bone size={17} strokeWidth={2} color="#78845C" />} value={`${boopCount}`} />
      </View>
      <Modal visible={mapOpen && canShowMap} animationType="slide" onRequestClose={() => setMapOpen(false)}>
        <View style={styles.mapModal}>
          <View style={styles.mapModalHeader}>
            <View><Text style={styles.mapModalTitle}>{title}</Text><Text style={styles.mapModalMeta}>{walk.distance_km.toFixed(2)} km · {formatDuration(walk.duration_seconds)}</Text></View>
            <Pressable style={styles.closeMap} onPress={() => setMapOpen(false)} accessibilityLabel="Close route map"><X size={25} strokeWidth={2} color="#332E29" /></Pressable>
          </View>
          <View style={styles.fullMap}><WaltzMap points={points} interactive /></View>
        </View>
      </Modal>
    </View>
  );
}

function Metric({ icon, value }: { icon: React.ReactNode; value: string }) {
  return <View style={styles.metric}><>{icon}</><Text style={styles.metricValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  walkCard: { borderWidth: 1, borderColor: "#DDD8CF", borderRadius: 8, padding: 16, gap: 11 },
  badgeCard: { borderWidth: 1, borderColor: "#DDD8CF", borderRadius: 8, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  badgeMessage: { fontSize: 15, fontWeight: "800", color: "#332E29", lineHeight: 21 },
  header: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  title: { fontSize: 16, fontWeight: "700", color: "#1D1A17" },
  date: { fontSize: 10, color: "#82786E", marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  visibility: { fontSize: 9, fontWeight: "700", color: "#78845C", marginTop: 2 },
  moreButton: { paddingHorizontal: 5, paddingVertical: 2 },
  moreText: { fontSize: 15, fontWeight: "800", color: "#82786E", letterSpacing: 1 },
  map: { height: 128, borderRadius: 4, overflow: "hidden", backgroundColor: "#EFE8DC" },
  expandIcon: { position: "absolute", top: 8, right: 8, width: 29, height: 29, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,253,248,.88)", borderWidth: 1, borderColor: "#DDD8CF", borderRadius: 4 },
  metrics: { flexDirection: "row", justifyContent: "flex-start", alignItems: "center", gap: 22, borderTopWidth: 1, borderTopColor: "#E5E0D8", paddingTop: 11 },
  metric: { flexDirection: "row", alignItems: "center", gap: 5 },
  metricValue: { fontSize: 12, fontWeight: "700", color: "#655D54" },
  mapModal: { flex: 1, backgroundColor: "#F8F3E9", paddingTop: 62, paddingHorizontal: 18, paddingBottom: 24 },
  mapModalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  mapModalTitle: { fontFamily: "Schoolbell_400Regular", fontSize: 29, color: "#1D1A17" },
  mapModalMeta: { fontSize: 11, fontWeight: "700", color: "#756B60", marginTop: 2 },
  closeMap: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  fullMap: { flex: 1, borderWidth: 1, borderColor: "#DDD8CF", borderRadius: 8, overflow: "hidden" },
});
