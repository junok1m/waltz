import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Balloon, Bird, Coffee, Fish, Flame, Mountain, MoonStar } from "@sketchyicons/react-native";
import type { DogBadge } from "../types/badge";
import type { Dog } from "../types/dog";
import type { Walk } from "../types/walk";
import { calculateWalkStreak } from "../utils/streak";
import { BottomNav } from "./BottomNav";
import type { AppTab } from "./HubScreen";

type ReportPeriod = "today" | "week" | "month" | "year";
type Range = { start: Date; end: Date };

const PERIODS: Array<{ value: ReportPeriod; label: string }> = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "year", label: "Year to date" },
];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function startOfWeek(date: Date) {
  const start = startOfDay(date);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}
function rangeFor(period: ReportPeriod, now: Date): Range {
  const end = new Date(startOfDay(now));
  end.setDate(end.getDate() + 1);
  if (period === "today") return { start: startOfDay(now), end };
  if (period === "week") return { start: startOfWeek(now), end };
  if (period === "month") return { start: new Date(now.getFullYear(), now.getMonth(), 1), end };
  return { start: new Date(now.getFullYear(), 0, 1), end };
}
function isInRange(value: string, range: Range) {
  const time = new Date(value).getTime();
  return time >= range.start.getTime() && time < range.end.getTime();
}
function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
function reportDate(period: ReportPeriod, now: Date) {
  if (period === "today") return now.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  if (period === "week") {
    const start = startOfWeek(now);
    return `${start.toLocaleDateString("en-AU", { day: "numeric", month: "short" })} – ${now.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}`;
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

function wobblyPaperBorder(width: number, height: number) {
  const inset = 2;
  const corner = Math.min(18, width / 12, height / 12);
  const right = width - inset;
  const bottom = height - inset;

  return [
    `M ${inset + corner} ${inset + 0.4}`,
    `C ${width * 0.25} ${inset - 0.2}, ${width * 0.42} ${inset + 0.8}, ${width * 0.58} ${inset + 0.1}`,
    `C ${width * 0.72} ${inset + 0.7}, ${right - corner * 0.45} ${inset - 0.2}, ${right - corner} ${inset + 0.5}`,
    `C ${right - corner * 0.28} ${inset + 0.8}, ${right - 0.2} ${inset + corner * 0.42}, ${right - 0.1} ${inset + corner}`,
    `C ${right + 0.4} ${height * 0.28}, ${right - 0.6} ${height * 0.46}, ${right + 0.1} ${height * 0.62}`,
    `C ${right - 0.5} ${height * 0.77}, ${right + 0.5} ${bottom - corner * 0.45}, ${right - 0.2} ${bottom - corner}`,
    `C ${right - 0.6} ${bottom - corner * 0.3}, ${right - corner * 0.42} ${bottom}, ${right - corner} ${bottom - 0.1}`,
    `C ${width * 0.74} ${bottom + 0.4}, ${width * 0.57} ${bottom - 0.6}, ${width * 0.4} ${bottom}`,
    `C ${width * 0.25} ${bottom - 0.5}, ${inset + corner * 0.45} ${bottom + 0.4}, ${inset + corner} ${bottom - 0.2}`,
    `C ${inset + corner * 0.3} ${bottom - 0.6}, ${inset + 0.4} ${bottom - corner * 0.42}, ${inset + 0.3} ${bottom - corner}`,
    `C ${inset - 0.2} ${height * 0.76}, ${inset + 0.8} ${height * 0.58}, ${inset + 0.2} ${height * 0.41}`,
    `C ${inset + 0.7} ${height * 0.25}, ${inset - 0.2} ${inset + corner * 0.45}, ${inset + 0.4} ${inset + corner}`,
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
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [paperSize, setPaperSize] = useState({ width: 0, height: 0 });
  const now = new Date();
  const range = rangeFor(period, now);
  const selected = useMemo(() => walks.filter((walk) => isInRange(walk.ended_at, range)), [walks, period]);
  const earned = useMemo(
    () => badges.filter((badge) => badge.badge_type === "monthly" && isInRange(badge.earned_at, range)),
    [badges, period],
  );

  const distance = selected.reduce((sum, walk) => sum + walk.distance_km, 0);
  const seconds = selected.reduce((sum, walk) => sum + walk.duration_seconds, 0);
  const activeDays = activeDayCount(selected);
  const longest = selected.reduce((best, walk) => Math.max(best, walk.distance_km), 0);
  const streak = calculateWalkStreak(walks, now);
  const periodLabel = PERIODS.find((item) => item.value === period)?.label ?? "This month";

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Report</Text>
        <View style={styles.periodControl}>
          <Pressable
            style={styles.headerSelector}
            onPress={() => setSelectorOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityLabel="Change reporting period"
          >
            <Text style={styles.headerSelectorText}>{periodLabel}</Text>
            <Text style={styles.headerChevron}>{selectorOpen ? "⌃" : "⌄"}</Text>
          </Pressable>
          {selectorOpen ? (
            <View style={styles.headerMenu}>
              {PERIODS.map((item) => (
                <Pressable
                  key={item.value}
                  style={[styles.headerMenuRow, item.value === period && styles.headerMenuRowActive]}
                  onPress={() => {
                    setPeriod(item.value);
                    setSelectorOpen(false);
                  }}
                >
                  <Text style={[styles.headerMenuText, item.value === period && styles.headerMenuTextActive]}>{item.label}</Text>
                  {item.value === period ? <Text style={styles.check}>✓</Text> : null}
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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
              <Path
                d={wobblyPaperBorder(paperSize.width, paperSize.height)}
                fill="none"
                stroke="#D8D0C4"
                strokeWidth={1.05}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          ) : null}
          <View style={styles.paper}>
          <View style={styles.identityRow}>
            <View style={styles.dogIdentity}>
              <Text style={styles.identity}>{dog.name}</Text>
            </View>
            <View style={styles.identityRight}>
              <Text style={styles.micro}>REPORT DATE</Text>
              <Text style={styles.identitySmall}>{reportDate(period, now)}</Text>
            </View>
          </View>

          <Rule />

          <View style={styles.summarySection}><SectionTitle>SUMMARY</SectionTitle></View>
          <LedgerRow label="Waltzes" value={String(selected.length)} />
          <LedgerRow label="Distance" value={`${distance.toFixed(1)} km`} />
          <LedgerRow label="Waltz time" value={formatDuration(seconds)} />
          <LedgerRow label="Active days" value={`${activeDays} day${activeDays === 1 ? "" : "s"}`} />

          <Rule />

          <SectionTitle>HIGHLIGHTS</SectionTitle>
          <LedgerRow label="Longest waltz" value={selected.length ? `${longest.toFixed(1)} km` : "—"} />
          <LedgerRow label="Current streak" value={streak ? `${streak} day${streak === 1 ? "" : "s"}` : "—"} />

          <Rule />

          <SectionTitle>EARNED THIS PERIOD</SectionTitle>
          {earned.length ? (
            <View style={styles.badges}>
              {earned.map((badge) => <BadgeStamp key={badge.id} id={badge.badge_id} />)}
            </View>
          ) : (
            <Text style={styles.empty}>No new stamps yet. Tiny paws are still clocking in.</Text>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerCopy}>generated by Waltz · {now.getFullYear()}</Text>
          </View>
          </View>

        </View>
      </ScrollView>

      <BottomNav active="map" onNavigate={onNavigate} onStartPress={onStartWalk} />
    </View>
  );
}

function Rule() {
  return <View style={styles.rule} />;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.section}>{children}</Text>;
}

function LedgerRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.ledger}>
      <Text style={styles.ledgerLabel}>{label}</Text>
      <Text style={styles.ledgerValue}>{value}</Text>
    </View>
  );
}

function BadgeStamp({ id }: { id: string }) {
  const iconProps = { size: 18, strokeWidth: 2, color: "#687455" };
  const icon =
    id === "keep-flame" ? <Flame {...iconProps} /> :
    id === "tiny-adventures" ? <Balloon {...iconProps} /> :
    id === "trail" ? <Mountain {...iconProps} /> :
    id === "gone-fishing" ? <Fish {...iconProps} /> :
    id === "coffee-stop" ? <Coffee {...iconProps} /> :
    id === "early-bird" ? <Bird {...iconProps} /> :
    id === "night-shift" ? <MoonStar {...iconProps} /> :
    null;

  return <View style={styles.badge}>{icon}</View>;
}


const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "space-between" },
  header: {
    position: "relative",
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  pageTitle: { fontFamily: "Schoolbell_400Regular", fontSize: 34, color: "#1D1A17" },
  periodControl: { position: "relative", alignItems: "flex-end" },
  headerSelector: {
    minWidth: 112,
    height: 36,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#D8D1C7",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: "#FCF8F1",
  },
  headerSelectorText: { fontSize: 11, fontWeight: "800", color: "#332E29" },
  headerChevron: { fontSize: 14, color: "#78845C" },
  headerMenu: {
    position: "absolute",
    top: 40,
    right: 0,
    width: 148,
    zIndex: 30,
    borderWidth: 1,
    borderColor: "#D8D1C7",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#FFFDF8",
  },
  headerMenuRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFFDF8",
  },
  headerMenuRowActive: { backgroundColor: "#F1E7D7" },
  headerMenuText: { fontSize: 11, color: "#655D54" },
  headerMenuTextActive: { fontWeight: "900", color: "#596442" },
  scroll: { paddingBottom: 8 },
  paperShell: {
    position: "relative",
    backgroundColor: "transparent",
    marginHorizontal: -10,
  },
  paper: {
    position: "relative",
    zIndex: 1,
    paddingHorizontal: 30,
    paddingTop: 24,
    paddingBottom: 18,
  },
  paperBorderOverlay: { position: "absolute", top: 0, left: 0, zIndex: 0 },
  identityRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 14, marginBottom: 2 },
  dogIdentity: { justifyContent: "center" },
  identityRight: { alignItems: "flex-end", flex: 1 },
  micro: { fontSize: 8, fontWeight: "900", letterSpacing: 1.4, color: "#9A9187" },
  identity: { fontFamily: "Schoolbell_400Regular", fontSize: 26, color: "#332E29" },
  identitySmall: { fontSize: 11, fontWeight: "800", color: "#655D54", marginTop: 4, textAlign: "right" },
  rule: { height: 1, backgroundColor: "#DED6CA", marginVertical: 16 },
  summarySection: { marginTop: 24 },
  section: { fontSize: 9, fontWeight: "900", letterSpacing: 1.6, color: "#78845C", marginBottom: 9 },
  ledger: {
    minHeight: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E9E2D8",
  },
  ledgerLabel: { fontSize: 12, color: "#756B60" },
  ledgerValue: { fontSize: 13, fontWeight: "900", color: "#28231F", textAlign: "right" },
  badges: { flexDirection: "row", flexWrap: "nowrap", gap: 10, alignItems: "center" },
  badge: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CCD2BF",
    backgroundColor: "#F4F5ED",
    borderRadius: 17,
  },
  empty: { fontSize: 11, lineHeight: 16, color: "#9A9187", fontStyle: "italic" },
  footer: {
    alignItems: "center",
    marginTop: 18,
    paddingTop: 10,
    paddingBottom: 0,
    borderTopWidth: 1,
    borderTopColor: "#DED6CA",
  },
  footerCopy: { fontSize: 8, letterSpacing: 1, color: "#AAA196", textTransform: "uppercase" },
});
