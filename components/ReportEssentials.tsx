import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Walk } from "../types/walk";

export type ReportPeriod = "today" | "week" | "month" | "year" | "all";
type Metric = "distance" | "time";
type Range = { start: Date | null; end: Date };
type Bucket = { key: string; label: string; distance: number; seconds: number; count: number };

const PERIODS: Array<{ value: ReportPeriod; label: string }> = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "YTD" },
  { value: "all", label: "All time" },
];

function startOfDay(date: Date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
function addDays(date: Date, days: number) { const next = new Date(date); next.setDate(next.getDate() + days); return next; }
function startOfWeek(date: Date) { const day = (date.getDay() + 6) % 7; return addDays(startOfDay(date), -day); }
function startOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function startOfYear(date: Date) { return new Date(date.getFullYear(), 0, 1); }
function dayKey(date: Date) { return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`; }
function monthKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }

export function rangeForPeriod(period: ReportPeriod, now = new Date()): Range {
  const end = addDays(startOfDay(now), 1);
  if (period === "today") return { start: startOfDay(now), end };
  if (period === "week") return { start: startOfWeek(now), end };
  if (period === "month") return { start: startOfMonth(now), end };
  if (period === "year") return { start: startOfYear(now), end };
  return { start: null, end };
}

function previousRange(period: ReportPeriod, now = new Date()): Range | null {
  const current = rangeForPeriod(period, now);
  if (!current.start) return null;
  const elapsed = current.end.getTime() - current.start.getTime();
  if (period === "today" || period === "week") return { start: new Date(current.start.getTime() - elapsed), end: current.start };
  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return { start, end: new Date(Math.min(start.getTime() + elapsed, new Date(now.getFullYear(), now.getMonth(), 1).getTime())) };
  }
  const start = new Date(now.getFullYear() - 1, 0, 1);
  return { start, end: new Date(start.getTime() + elapsed) };
}

function inRange(walk: Walk, range: Range) {
  const time = new Date(walk.ended_at).getTime();
  return (!range.start || time >= range.start.getTime()) && time < range.end.getTime();
}

export function walksForPeriod(walks: Walk[], period: ReportPeriod) {
  const range = rangeForPeriod(period);
  return walks.filter((walk) => inRange(walk, range));
}

function totals(walks: Walk[]) {
  return {
    distance: walks.reduce((sum, walk) => sum + walk.distance_km, 0),
    seconds: walks.reduce((sum, walk) => sum + walk.duration_seconds, 0),
    count: walks.length,
  };
}

function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function comparisonCopy(period: ReportPeriod, current: number, previous: number) {
  if (period === "all") return "Every waltz since the beginning.";
  const name = period === "today" ? "yesterday" : period === "week" ? "the same point last week" : period === "month" ? "the same point last month" : "the same point last year";
  if (previous === 0) return current === 0 ? `No distance yet. ${name[0].toUpperCase() + name.slice(1)} was quiet too.` : `First distance on the board compared with ${name}.`;
  const delta = ((current - previous) / previous) * 100;
  if (Math.abs(delta) < 1) return `Almost exactly the same as ${name}.`;
  return `${Math.abs(delta).toFixed(0)}% ${delta > 0 ? "more" : "less"} distance than ${name}.`;
}

function buildBuckets(walks: Walk[], period: ReportPeriod, now = new Date()): Bucket[] {
  const selected = walksForPeriod(walks, period);
  if (period === "today") return selected.sort((a, b) => new Date(a.ended_at).getTime() - new Date(b.ended_at).getTime()).map((walk) => ({
    key: String(walk.id),
    label: new Date(walk.ended_at).toLocaleTimeString("en-AU", { hour: "numeric" }),
    distance: walk.distance_km,
    seconds: walk.duration_seconds,
    count: 1,
  }));

  const buckets = new Map<string, Bucket>();
  if (period === "week") {
    const start = startOfWeek(now);
    for (let index = 0; index < 7; index += 1) {
      const date = addDays(start, index);
      buckets.set(dayKey(date), { key: dayKey(date), label: date.toLocaleDateString("en-AU", { weekday: "narrow" }), distance: 0, seconds: 0, count: 0 });
    }
  } else if (period === "month") {
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let day = 1; day <= days; day += 1) {
      const date = new Date(now.getFullYear(), now.getMonth(), day);
      buckets.set(dayKey(date), { key: dayKey(date), label: day === 1 || day % 7 === 0 || day === days ? String(day) : "", distance: 0, seconds: 0, count: 0 });
    }
  } else if (period === "year") {
    for (let month = 0; month < 12; month += 1) {
      const date = new Date(now.getFullYear(), month, 1);
      buckets.set(monthKey(date), { key: monthKey(date), label: date.toLocaleDateString("en-AU", { month: "narrow" }), distance: 0, seconds: 0, count: 0 });
    }
  } else {
    for (const walk of selected) {
      const date = new Date(walk.ended_at), key = monthKey(date);
      if (!buckets.has(key)) buckets.set(key, { key, label: date.toLocaleDateString("en-AU", { month: "short", year: "2-digit" }), distance: 0, seconds: 0, count: 0 });
    }
  }

  for (const walk of selected) {
    const date = new Date(walk.ended_at), key = period === "year" || period === "all" ? monthKey(date) : dayKey(date);
    const bucket = buckets.get(key);
    if (bucket) { bucket.distance += walk.distance_km; bucket.seconds += walk.duration_seconds; bucket.count += 1; }
  }
  const result = [...buckets.values()];
  return period === "all" ? result.sort((a, b) => a.key.localeCompare(b.key)) : result;
}

export function ReportEssentials({ walks, period, onPeriodChange }: { walks: Walk[]; period: ReportPeriod; onPeriodChange: (period: ReportPeriod) => void }) {
  const [metric, setMetric] = useState<Metric>("distance");
  const selected = useMemo(() => walksForPeriod(walks, period), [walks, period]);
  const summary = useMemo(() => totals(selected), [selected]);
  const previous = previousRange(period);
  const previousDistance = previous ? totals(walks.filter((walk) => inRange(walk, previous))).distance : 0;
  const buckets = useMemo(() => buildBuckets(walks, period), [walks, period]);
  const values = buckets.map((bucket) => metric === "distance" ? bucket.distance : bucket.seconds / 60);
  const max = Math.max(...values, 0.01);
  const dense = buckets.length > 14;

  return <>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periods}>
      {PERIODS.map((item) => <Pressable key={item.value} onPress={() => onPeriodChange(item.value)} style={[styles.period, period === item.value && styles.periodActive]}><Text style={[styles.periodText, period === item.value && styles.periodTextActive]}>{item.label}</Text></Pressable>)}
    </ScrollView>
    <View style={styles.summaryCard}>
      <Text style={styles.distance}>{summary.distance.toFixed(1)} km</Text>
      <View style={styles.summaryRow}><Summary label="Time" value={formatDuration(summary.seconds)} /><View style={styles.divider}/><Summary label="Waltzes" value={String(summary.count)} /></View>
      <Text style={styles.comparison}>{comparisonCopy(period, summary.distance, previousDistance)}</Text>
    </View>
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}><Text style={styles.chartTitle}>Waltz rhythm</Text><View style={styles.metricTabs}>{(["distance", "time"] as Metric[]).map((value) => <Pressable key={value} onPress={() => setMetric(value)} style={[styles.metricTab, metric === value && styles.metricTabActive]}><Text style={[styles.metricText, metric === value && styles.metricTextActive]}>{value === "distance" ? "Distance" : "Time"}</Text></Pressable>)}</View></View>
      <ScrollView horizontal={dense} showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.bars, dense && styles.barsDense]}>
        {buckets.length ? buckets.map((bucket, index) => { const value = values[index]; return <View key={bucket.key} style={[styles.barCell, dense && styles.barCellDense]}><View style={styles.barArea}><View style={[styles.bar, { height: value ? Math.max(5, value / max * 112) : 2 }, !value && styles.emptyBar]}/></View><Text style={styles.barLabel}>{bucket.label}</Text></View>; }) : <Text style={styles.noData}>Your first waltz will draw the chart.</Text>}
      </ScrollView>
    </View>
  </>;
}

function Summary({ label, value }: { label: string; value: string }) { return <View style={styles.summaryItem}><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  periods: { gap: 7, paddingRight: 8 },
  period: { borderWidth: 1, borderColor: "#D8D1C7", borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 },
  periodActive: { backgroundColor: "#78845C", borderColor: "#78845C" },
  periodText: { fontSize: 11, fontWeight: "800", color: "#756B60" },
  periodTextActive: { color: "#FFFDF8" },
  summaryCard: { backgroundColor: "#FFFDF8", borderRadius: 24, padding: 18, gap: 13 },
  distance: { fontSize: 42, fontWeight: "900", color: "#1D1A17" },
  summaryRow: { flexDirection: "row", alignItems: "stretch", backgroundColor: "#F6F0E5", borderRadius: 16, padding: 12 },
  summaryItem: { flex: 1 }, summaryLabel: { fontSize: 9, fontWeight: "800", color: "#8A8176" }, summaryValue: { fontSize: 19, fontWeight: "900", color: "#332E29", marginTop: 3 },
  divider: { width: 1, backgroundColor: "#DDD4C8", marginHorizontal: 12 },
  comparison: { fontSize: 11, fontWeight: "700", lineHeight: 16, color: "#596442" },
  chartCard: { backgroundColor: "#FFFDF8", borderRadius: 24, padding: 16, gap: 14 },
  chartHeader: { gap: 10 }, chartTitle: { fontFamily: "Schoolbell_400Regular", fontSize: 26, color: "#1D1A17" },
  metricTabs: { alignSelf: "flex-start", flexDirection: "row", backgroundColor: "#F1E7D7", borderRadius: 999, padding: 3 },
  metricTab: { paddingHorizontal: 13, paddingVertical: 6, borderRadius: 999 }, metricTabActive: { backgroundColor: "#8C9670" }, metricText: { fontSize: 10, fontWeight: "800", color: "#82786E" }, metricTextActive: { color: "#FFFDF8" },
  bars: { height: 145, minWidth: "100%", alignItems: "flex-end" }, barsDense: { minWidth: 330 },
  barCell: { flex: 1, minWidth: 22, height: 145, alignItems: "center", justifyContent: "flex-end" }, barCellDense: { flex: 0, width: 14, minWidth: 14 },
  barArea: { height: 116, width: "100%", alignItems: "center", justifyContent: "flex-end", borderBottomWidth: 1, borderBottomColor: "#DDD4C8" },
  bar: { width: "58%", maxWidth: 20, minWidth: 3, backgroundColor: "#8C9670", borderTopLeftRadius: 4, borderTopRightRadius: 4 }, emptyBar: { opacity: 0.14 },
  barLabel: { height: 25, paddingTop: 5, fontSize: 8, color: "#9A9187" }, noData: { color: "#9A9187", fontSize: 11, alignSelf: "center" },
});
