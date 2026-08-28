import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Share as NativeShare, StyleSheet, Text, View } from "react-native";
import { Calendar1, Download, Footprints, Share as ShareIcon, Timer } from "@sketchyicons/react-native";
import Svg, { Path } from "react-native-svg";
import type { DogBadge } from "../types/badge";
import type { Dog } from "../types/dog";
import type { Walk } from "../types/walk";
import { fetchBoopCountsByWalkIds } from "../services/boops";
import { BadgeIcon } from "./BadgeIcon";
import { BottomNav } from "./BottomNav";
import type { AppTab } from "./HubScreen";
import {
  type ReportPeriod,
  buildBuckets,
  formatDuration,
  rangeForPeriod,
  totals,
  walksForPeriod,
} from "./ReportEssentials";

const PERIODS: Array<{ value: Exclude<ReportPeriod, "all">; label: string }> = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

function isInRange(value: string, range: { start: Date | null; end: Date }) {
  const time = new Date(value).getTime();
  return (!range.start || time >= range.start.getTime()) && time < range.end.getTime();
}

function reportDate(period: Exclude<ReportPeriod, "all">, now: Date) {
  if (period === "today") return now.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "short" });
  if (period === "week") {
    const start = rangeForPeriod("week", now).start!;
    return `${start.toLocaleDateString("en-AU", { day: "numeric", month: "short" })} – ${now.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}`;
  }
  if (period === "month") return now.toLocaleDateString("en-AU", { month: "long", year: "numeric" });
  return `1 Jan – ${now.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}`;
}

function activeDayCount(walks: Walk[]) {
  return new Set(walks.map((walk) => {
    const date = new Date(walk.ended_at);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  })).size;
}

function WobblyRule() {
  return (
    <View style={styles.rule}>
      <Svg width="100%" height={6} viewBox="0 0 100 6" preserveAspectRatio="none">
        <Path
          d="M 0 3.2 C 12 1.7, 24 4.4, 37 2.8 C 51 1.4, 63 4.5, 76 2.7 C 87 1.8, 94 3.8, 100 2.9"
          fill="none"
          stroke="#E4DDD3"
          strokeWidth={0.7}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

function wobblyPaperBorder(width: number, height: number) {
  const inset = 5;
  const corner = Math.min(18, width / 12, height / 12);
  const right = width - inset;
  const bottom = height - inset;

  return [
    `M ${inset + corner} ${inset + 0.8}`,
    `C ${width * 0.25} ${inset - 2.6}, ${width * 0.42} ${inset + 3.4}, ${width * 0.58} ${inset - 1.4}`,
    `C ${width * 0.72} ${inset + 3.0}, ${right - corner * 0.45} ${inset - 2.3}, ${right - corner} ${inset + 1.8}`,
    `C ${right - corner * 0.28} ${inset + 0.8}, ${right - 0.2} ${inset + corner * 0.42}, ${right - 0.1} ${inset + corner}`,
    `C ${right + 2.8} ${height * 0.28}, ${right - 3.1} ${height * 0.46}, ${right + 2.4} ${height * 0.62}`,
    `C ${right - 2.7} ${height * 0.77}, ${right + 3.0} ${bottom - corner * 0.45}, ${right - 1.8} ${bottom - corner}`,
    `C ${right - 0.6} ${bottom - corner * 0.3}, ${right - corner * 0.42} ${bottom}, ${right - corner} ${bottom - 0.1}`,
    `C ${width * 0.74} ${bottom + 2.8}, ${width * 0.57} ${bottom - 3.0}, ${width * 0.4} ${bottom + 2.2}`,
    `C ${width * 0.25} ${bottom - 2.7}, ${inset + corner * 0.45} ${bottom + 3.0}, ${inset + corner} ${bottom - 1.8}`,
    `C ${inset + corner * 0.3} ${bottom - 0.6}, ${inset + 0.4} ${bottom - corner * 0.42}, ${inset + 0.3} ${bottom - corner}`,
    `C ${inset - 2.8} ${height * 0.76}, ${inset + 3.2} ${height * 0.58}, ${inset - 2.4} ${height * 0.41}`,
    `C ${inset + 3.0} ${height * 0.25}, ${inset - 2.5} ${inset + corner * 0.45}, ${inset + 1.8} ${inset + corner}`,
    `C ${inset + 0.8} ${inset + corner * 0.3}, ${inset + corner * 0.42} ${inset + 0.8}, ${inset + corner} ${inset + 0.4} Z`,
  ].join(" ");
}

export function ReportScreen({
  walks,
  badges,
  dog,
  onNavigate,
  onStartWalk,
}: {
  walks: Walk[];
  badges: DogBadge[];
  dog: Dog;
  onNavigate: (tab: AppTab) => void;
  onStartWalk: () => void;
}) {
  const [period, setPeriod] = useState<Exclude<ReportPeriod, "all">>("month");
  const [paperSize, setPaperSize] = useState({ width: 0, height: 0 });
  const [boopsReceived, setBoopsReceived] = useState(0);
  const now = new Date();
  const selected = useMemo(() => walksForPeriod(walks, period), [walks, period]);
  const earned = useMemo(
    () => badges.filter((badge) => (badge.badge_type === "monthly" || badge.badge_type === "mileage") && isInRange(badge.earned_at, rangeForPeriod(period, now))),
    [badges, period],
  );
  useEffect(() => {
    let active = true;
    fetchBoopCountsByWalkIds(selected.map((walk) => walk.id))
      .then((counts) => {
        if (active) setBoopsReceived(Object.values(counts).reduce((sum, count) => sum + count, 0));
      })
      .catch((error) => {
        console.error("Load report Boops error:", error);
        if (active) setBoopsReceived(0);
      });
    return () => { active = false; };
  }, [selected]);

  const summary = totals(selected);
  const activeDays = activeDayCount(selected);
  const buckets = useMemo(() => buildBuckets(walks, period, now), [walks, period]);
  const maxDistance = Math.max(...buckets.map((bucket) => bucket.distance), 0.01);

  function shareReport() {
    void NativeShare.share({
      title: `${dog.name}'s Waltz report`,
      message: `${dog.name}'s ${reportDate(period, now)} Waltz report\n${summary.distance.toFixed(1)} km · ${summary.count} waltz${summary.count === 1 ? "" : "es"} · ${formatDuration(summary.seconds)} · ${activeDays} day${activeDays === 1 ? "" : "s"} out`,
    });
  }

  function downloadReport() {
    Alert.alert("Download report", "Image download is the next step — the report layout is ready for export.");
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Report</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerButton} onPress={shareReport} hitSlop={8} accessibilityRole="button" accessibilityLabel="Share report">
            <ShareIcon size={22} strokeWidth={2} color="#78845C" />
          </Pressable>
          <Pressable style={styles.headerButton} onPress={downloadReport} hitSlop={8} accessibilityRole="button" accessibilityLabel="Download report">
            <Download size={22} strokeWidth={2} color="#78845C" />
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View
          style={styles.paperShell}
          onLayout={({ nativeEvent: { layout } }) => {
            if (layout.width > 0 && layout.height > 0) {
              setPaperSize((current) =>
                current.width === layout.width && current.height === layout.height
                  ? current
                  : { width: layout.width, height: layout.height },
              );
            }
          }}
        >
          {paperSize.width > 0 && paperSize.height > 0 ? (
            <Svg
              pointerEvents="none"
              width={paperSize.width}
              height={paperSize.height}
              style={styles.paperBorderOverlay}
              viewBox={`0 0 ${paperSize.width} ${paperSize.height}`}
            >
              <Path d={wobblyPaperBorder(paperSize.width, paperSize.height)} fill="#FFFDF8" stroke="#D2CBBF" strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          ) : (
            <View style={styles.paperFallback} />
          )}

          <View style={styles.paper}>
            <View style={styles.periodRow}>
              {PERIODS.map((item) => (
                <Pressable key={item.value} onPress={() => setPeriod(item.value)} hitSlop={8}>
                  <Text style={[styles.periodText, item.value === period && styles.periodTextActive]}>{item.label}</Text>
                  <View style={[styles.periodMark, item.value === period && styles.periodMarkActive]} />
                </Pressable>
              ))}
            </View>

            <View style={styles.identityRow}>
              <Text style={styles.identity}>{dog.name}</Text>
              <Text style={styles.dateLine}>{reportDate(period, now)}</Text>
            </View>
            <Text style={styles.hero}>
              {summary.distance.toFixed(1)}<Text style={styles.heroUnit}> km</Text>
            </Text>
            <View style={styles.meta}>
              <View style={styles.metaItem}>
                <Footprints size={16} strokeWidth={2} color="#78845C" />
                <Text style={styles.metaText}>{summary.count} waltz{summary.count === 1 ? "" : "es"}</Text>
              </View>
              <View style={styles.metaItem}>
                <Timer size={16} strokeWidth={2} color="#78845C" />
                <Text style={styles.metaText}>{formatDuration(summary.seconds)}</Text>
              </View>
              <View style={styles.metaItem}>
                <Calendar1 size={16} strokeWidth={2} color="#78845C" />
                <Text style={styles.metaText}>{activeDays} day{activeDays === 1 ? "" : "s"} out</Text>
              </View>
            </View>
            {boopsReceived ? <Text style={styles.boops}>{boopsReceived} boop{boopsReceived === 1 ? "" : "s"} this period</Text> : null}

            <WobblyRule />

            <Text style={styles.section}>This period</Text>
            {buckets.length ? (
              <View style={styles.bars}>
                {buckets.map((bucket) => (
                  <View key={bucket.key} style={styles.barCell}>
                    <View style={styles.barArea}>
                      <View style={[styles.bar, { height: bucket.distance ? Math.max(4, bucket.distance / maxDistance * 72) : 2 }, !bucket.distance && styles.emptyBar]} />
                    </View>
                    <Text style={styles.barLabel}>{bucket.label}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.empty}>The first waltz will draw the days.</Text>
            )}

            {earned.length ? (
              <>
                <WobblyRule />
                <Text style={styles.section}>Stamps</Text>
                <View style={styles.badges}>
                  {earned.map((badge) => <BadgeIcon key={badge.id} badgeId={badge.badge_id} size={44} labelLines={2} />)}
                </View>
              </>
            ) : null}

            <View style={styles.footer}>
              <Text style={styles.footerCopy}>Waltz · {now.getFullYear()}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <BottomNav active="map" onNavigate={onNavigate} onStartPress={onStartWalk} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "space-between" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 42, marginBottom: 14 },
  pageTitle: { fontFamily: "Schoolbell_400Regular", fontSize: 34, color: "#1D1A17" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 14 },
  headerButton: { paddingVertical: 8 },
  scrollView: { flex: 1 },
  scroll: { paddingBottom: 18 },
  paperShell: {
    position: "relative",
    backgroundColor: "transparent",
    minHeight: 420,
  },
  paperFallback: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#FFFDF8",
    borderRadius: 8,
  },
  paper: {
    position: "relative",
    zIndex: 1,
    paddingHorizontal: 26,
    paddingTop: 22,
    paddingBottom: 16,
  },
  paperBorderOverlay: { position: "absolute", top: 0, left: 0, zIndex: 0 },
  periodRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 18, paddingHorizontal: 2 },
  periodText: { fontSize: 12, fontWeight: "700", color: "#9A9187" },
  periodTextActive: { color: "#596442", fontWeight: "900" },
  periodMark: { height: 2, marginTop: 4, backgroundColor: "transparent" },
  periodMarkActive: { backgroundColor: "#78845C" },
  identityRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  identity: { fontFamily: "Schoolbell_400Regular", fontSize: 28, color: "#332E29" },
  dateLine: { fontSize: 12, color: "#82786E" },
  hero: { fontFamily: "Schoolbell_400Regular", fontSize: 58, lineHeight: 66, color: "#1D1A17", marginTop: 12 },
  heroUnit: { fontSize: 30, color: "#332E29" },
  meta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 10, fontWeight: "800", color: "#78845C" },
  boops: { fontSize: 11, color: "#9A9187", marginTop: 10 },
  rule: { height: 6, marginVertical: 13 },
  section: { fontSize: 9, fontWeight: "900", letterSpacing: 1.5, color: "#78845C", marginBottom: 10, textTransform: "uppercase" },
  bars: { height: 98, width: "100%", flexDirection: "row", alignItems: "flex-end" },
  barCell: { flex: 1, minWidth: 0, height: 98, alignItems: "center", justifyContent: "flex-end" },
  barArea: { height: 76, width: "100%", alignItems: "center", justifyContent: "flex-end" },
  bar: { width: "54%", maxWidth: 16, minWidth: 3, backgroundColor: "#8C9670", borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  emptyBar: { opacity: 0.16 },
  barLabel: { height: 18, paddingTop: 4, fontSize: 8, color: "#9A9187" },
  badges: { flexDirection: "row", flexWrap: "wrap", columnGap: 4, rowGap: 12 },
  empty: { fontSize: 12, lineHeight: 17, color: "#9A9187" },
  footer: { alignItems: "center", marginTop: 18, paddingTop: 10 },
  footerCopy: { fontSize: 8, letterSpacing: 1, color: "#AAA196", textTransform: "uppercase" },
});
