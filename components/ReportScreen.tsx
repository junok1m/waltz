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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.paperShell}>
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

          <Text style={styles.micro}>REPORTING PERIOD</Text>
          <Pressable style={styles.selector} onPress={() => setSelectorOpen((open) => !open)}>
            <Text style={styles.selectorText}>{periodLabel}</Text>
            <Text style={styles.chevron}>{selectorOpen ? "⌃" : "⌄"}</Text>
          </Pressable>

          {selectorOpen ? (
            <View style={styles.menu}>
              {PERIODS.map((item) => (
                <Pressable
                  key={item.value}
                  style={[styles.menuRow, item.value === period && styles.menuRowActive]}
                  onPress={() => {
                    setPeriod(item.value);
                    setSelectorOpen(false);
                  }}
                >
                  <Text style={[styles.menuText, item.value === period && styles.menuTextActive]}>{item.label}</Text>
                  {item.value === period ? <Text style={styles.check}>✓</Text> : null}
                </Pressable>
              ))}
            </View>
          ) : null}

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
          <Svg pointerEvents="none" style={styles.paperBorderOverlay} viewBox="0 0 100 100" preserveAspectRatio="none">
            <Path
              d="M6 2.4 C20 1.8 37 2.8 54 2.1 C70 2.7 84 1.8 93 2.5 C96.8 2.8 98.1 5.1 97.9 8.8 C98.4 26 97.4 43 98.1 60 C97.5 76 98.5 88 97.8 93.2 C97.4 96.8 95.4 98 91.4 97.9 C75 98.4 59 97.4 42 98 C27 97.5 15 98.4 7.8 97.8 C4.2 97.4 2.4 95.4 2.3 91.7 C1.8 75 2.8 58 2.2 41 C2.7 25 1.8 13 2.4 7.2 C2.8 4.1 4.1 2.8 6 2.4 Z"
              fill="none"
              stroke="#D8D0C4"
              strokeWidth={1.05}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </Svg>
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
  scroll: { paddingBottom: 8 },
  paperShell: {
    position: "relative",
    backgroundColor: "transparent",
  },
  paper: {
    position: "relative",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 16,
  },
  paperBorderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "transparent", zIndex: 10 },
  identityRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 14, marginBottom: 2 },
  dogIdentity: { minHeight: 32, justifyContent: "flex-end" },
  identityRight: { alignItems: "flex-end", flex: 1 },
  micro: { fontSize: 8, fontWeight: "900", letterSpacing: 1.4, color: "#9A9187" },
  identity: { fontFamily: "Schoolbell_400Regular", fontSize: 26, color: "#332E29" },
  identitySmall: { fontSize: 11, fontWeight: "800", color: "#655D54", marginTop: 4, textAlign: "right" },
  rule: { height: 1, backgroundColor: "#DED6CA", marginVertical: 16 },
  selector: {
    marginTop: 7,
    borderWidth: 1,
    borderColor: "#D8D1C7",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FCF8F1",
  },
  selectorText: { fontSize: 13, fontWeight: "800", color: "#332E29" },
  chevron: { fontSize: 16, color: "#78845C" },
  menu: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#D8D1C7",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    overflow: "hidden",
    marginTop: -5,
  },
  menuRow: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#FFFDF8", flexDirection: "row", justifyContent: "space-between" },
  menuRowActive: { backgroundColor: "#F1E7D7" },
  menuText: { fontSize: 12, color: "#655D54" },
  menuTextActive: { fontWeight: "900", color: "#596442" },
  check: { fontWeight: "900", color: "#78845C" },
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
