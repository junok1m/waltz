import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Walk } from "../types/walk";
import { ReportPeriod, walksForPeriod } from "./ReportEssentials";
import { WaltzMap } from "./WaltzMap";

type Group = { key: string; label: string; walks: Walk[] };

function dayKey(value: string) { const date = new Date(value); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function monthKey(value: string) { const date = new Date(value); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }
function dateFromKey(key: string) { const [year, month, day = 1] = key.split("-").map(Number); return new Date(year, month - 1, day); }
function dayLabel(key: string) { return dateFromKey(key).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "short" }); }
function monthLabel(key: string) { return dateFromKey(key).toLocaleDateString("en-AU", { month: "long", year: "numeric" }); }
function fallbackTitle(value: string) { const hour = new Date(value).getHours(); return hour < 12 ? "Morning waltz" : hour < 18 ? "Afternoon waltz" : "Night waltz"; }
function formatDuration(seconds: number) { const minutes = Math.round(seconds / 60); return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`; }
function totalDistance(walks: Walk[]) { return walks.reduce((sum, walk) => sum + walk.distance_km, 0); }
function totalTime(walks: Walk[]) { return walks.reduce((sum, walk) => sum + walk.duration_seconds, 0); }
function privacyLabel(walk: Walk) {
  if (walk.route_visibility === "private" || (!walk.share_route && walk.route_visibility !== "stats_only")) return "Only me";
  if (walk.route_visibility === "stats_only") return "Stats only";
  if (walk.route_visibility === "full") return "Full route";
  return "Home area hidden";
}
function makeGroups(walks: Walk[], period: ReportPeriod) {
  const byMonth = period === "year" || period === "all";
  const groups = new Map<string, Group>();
  for (const walk of walks) {
    const key = byMonth ? monthKey(walk.ended_at) : dayKey(walk.ended_at);
    if (!groups.has(key)) groups.set(key, { key, label: byMonth ? monthLabel(key) : dayLabel(key), walks: [] });
    groups.get(key)!.walks.push(walk);
  }
  return [...groups.values()].sort((a, b) => b.key.localeCompare(a.key)).map((group) => ({ ...group, walks: group.walks.sort((a, b) => new Date(b.ended_at).getTime() - new Date(a.ended_at).getTime()) }));
}

export function ReportWalkDetails({ walks, period }: { walks: Walk[]; period: ReportPeriod }) {
  const selected = useMemo(() => walksForPeriod(walks, period), [walks, period]);
  const groups = useMemo(() => makeGroups(selected, period), [selected, period]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [selectedWalk, setSelectedWalk] = useState<Walk | null>(null);
  const monthly = period === "year" || period === "all";
  useEffect(() => { const today = dayKey(new Date().toISOString()); setExpandedGroups(period === "today" || period === "week" ? new Set([today]) : new Set()); setExpandedDays(new Set()); }, [period]);
  function toggle(setter: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) { setter((current) => { const next = new Set(current); next.has(key) ? next.delete(key) : next.add(key); return next; }); }
  return <View style={styles.section}>
    <View><Text style={styles.heading}>Walk details</Text><Text style={styles.intro}>{period === "today" ? "Every waltz today, ready to open." : monthly ? "Months first. Open a month, then a day." : "Grouped by day, so the list stays calm."}</Text></View>
    {!groups.length ? <View style={styles.empty}><Text style={styles.emptyText}>No waltzes in this period. Yet.</Text></View> : groups.map((group) => {
      const open = expandedGroups.has(group.key), days = monthly ? makeGroups(group.walks, "month") : [];
      return <View key={group.key} style={styles.group}>
        <Pressable style={styles.groupHeader} onPress={() => toggle(setExpandedGroups, group.key)} accessibilityRole="button" accessibilityState={{ expanded: open }}><View style={styles.flex}><Text style={styles.groupTitle}>{group.label}</Text><Text style={styles.groupMeta}>{group.walks.length} waltz{group.walks.length === 1 ? "" : "es"} · {totalDistance(group.walks).toFixed(1)} km · {formatDuration(totalTime(group.walks))}</Text></View><Text style={styles.chevron}>{open ? "−" : "+"}</Text></Pressable>
        {open && !monthly ? <View style={styles.rows}>{group.walks.map((walk) => <WalkRow key={walk.id} walk={walk} onPress={() => setSelectedWalk(walk)} />)}</View> : null}
        {open && monthly ? <View style={styles.dayGroups}>{days.map((day) => { const dayOpen = expandedDays.has(day.key); return <View key={day.key} style={styles.dayGroup}><Pressable style={styles.dayHeader} onPress={() => toggle(setExpandedDays, day.key)}><View style={styles.flex}><Text style={styles.dayTitle}>{day.label}</Text><Text style={styles.dayMeta}>{day.walks.length} · {totalDistance(day.walks).toFixed(1)} km · {formatDuration(totalTime(day.walks))}</Text></View><Text style={styles.dayChevron}>{dayOpen ? "−" : "+"}</Text></Pressable>{dayOpen ? <View style={styles.rows}>{day.walks.map((walk) => <WalkRow key={walk.id} walk={walk} onPress={() => setSelectedWalk(walk)} />)}</View> : null}</View>; })}</View> : null}
      </View>;
    })}
    <WalkModal walk={selectedWalk} onClose={() => setSelectedWalk(null)} />
  </View>;
}

function WalkRow({ walk, onPress }: { walk: Walk; onPress: () => void }) { return <Pressable style={styles.walkRow} onPress={onPress}><View style={styles.flex}><Text style={styles.walkTitle}>{walk.title?.trim() || fallbackTitle(walk.ended_at)}</Text><Text style={styles.walkMeta}>{new Date(walk.ended_at).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })} · {walk.distance_km.toFixed(2)} km · {formatDuration(walk.duration_seconds)}</Text></View><View style={styles.privacy}><Text style={styles.privacyText}>{privacyLabel(walk)}</Text></View></Pressable>; }
function WalkModal({ walk, onClose }: { walk: Walk | null; onClose: () => void }) {
  const points = walk?.route_points ?? [];
  return <Modal visible={Boolean(walk)} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>{walk ? <View style={styles.modal}><View style={styles.modalHeader}><View style={styles.flex}><Text style={styles.modalTitle}>{walk.title?.trim() || fallbackTitle(walk.ended_at)}</Text><Text style={styles.modalMeta}>{new Date(walk.ended_at).toLocaleString("en-AU", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</Text></View><Pressable onPress={onClose} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable></View><View style={styles.modalStats}><Text style={styles.modalStat}>{walk.distance_km.toFixed(2)} km</Text><Text style={styles.modalStat}>{formatDuration(walk.duration_seconds)}</Text><Text style={styles.modalPrivacy}>{privacyLabel(walk)}</Text></View>{points.length ? <View style={styles.map}><WaltzMap points={points} dogName={walk.dog_name} interactive /></View> : <View style={[styles.map, styles.noMap]}><Text style={styles.noMapTitle}>No route to show</Text><Text style={styles.noMapText}>{walk.route_visibility === "stats_only" ? "This waltz was saved as stats only." : "This older waltz does not include map data."}</Text></View>}</View> : null}</Modal>;
}

const styles = StyleSheet.create({
  section: { gap: 10 }, heading: { fontFamily: "Schoolbell_400Regular", fontSize: 28, color: "#1D1A17" }, intro: { fontSize: 11, color: "#82786E", marginTop: 1 }, empty: { backgroundColor: "#F1E7D7", borderRadius: 20, padding: 18 }, emptyText: { color: "#655D54", fontSize: 12 },
  group: { backgroundColor: "#FFFDF8", borderRadius: 21, overflow: "hidden" }, groupHeader: { flexDirection: "row", alignItems: "center", padding: 16, gap: 10 }, flex: { flex: 1 }, groupTitle: { fontSize: 15, fontWeight: "900", color: "#332E29" }, groupMeta: { fontSize: 10, color: "#82786E", marginTop: 4 }, chevron: { width: 24, textAlign: "center", fontSize: 20, color: "#78845C" },
  dayGroups: { paddingHorizontal: 10, paddingBottom: 10, gap: 7 }, dayGroup: { backgroundColor: "#F8F2E8", borderRadius: 15, overflow: "hidden" }, dayHeader: { flexDirection: "row", alignItems: "center", padding: 12 }, dayTitle: { fontSize: 12, fontWeight: "800", color: "#443D37" }, dayMeta: { fontSize: 9, color: "#8A8176", marginTop: 3 }, dayChevron: { fontSize: 16, color: "#8C9670" }, rows: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#E4DDD3" }, walkRow: { minHeight: 58, paddingHorizontal: 14, paddingVertical: 11, flexDirection: "row", alignItems: "center", gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E4DDD3" }, walkTitle: { fontSize: 13, fontWeight: "800", color: "#332E29" }, walkMeta: { fontSize: 9, color: "#82786E", marginTop: 3 }, privacy: { backgroundColor: "#EEE8DC", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }, privacyText: { fontSize: 8, fontWeight: "800", color: "#68704F" },
  modal: { flex: 1, backgroundColor: "#F8F3EA", padding: 20, paddingTop: 24, gap: 16 }, modalHeader: { flexDirection: "row", alignItems: "center", gap: 12 }, modalTitle: { fontFamily: "Schoolbell_400Regular", fontSize: 31, color: "#1D1A17" }, modalMeta: { fontSize: 11, color: "#82786E", marginTop: 2 }, close: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#FFFDF8", alignItems: "center", justifyContent: "center" }, closeText: { fontSize: 27, lineHeight: 29, color: "#443D37" }, modalStats: { flexDirection: "row", alignItems: "center", gap: 16 }, modalStat: { fontSize: 15, fontWeight: "900", color: "#332E29" }, modalPrivacy: { marginLeft: "auto", fontSize: 10, fontWeight: "800", color: "#68704F" }, map: { flex: 1, minHeight: 300, borderRadius: 22, overflow: "hidden", backgroundColor: "#EFE8DC" }, noMap: { alignItems: "center", justifyContent: "center", padding: 28 }, noMapTitle: { fontFamily: "Schoolbell_400Regular", fontSize: 27, color: "#332E29" }, noMapText: { fontSize: 11, lineHeight: 17, color: "#82786E", textAlign: "center", marginTop: 6 },
});
