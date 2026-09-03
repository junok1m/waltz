import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Bone, Cloudy, MapPin, Ruler, Sun, Timer, Trophy, Umbrella } from "@sketchyicons/react-native";
import { fetchBoopCountsByWalkIds } from "../services/boops";
import { DogBadge } from "../types/badge";
import { Walk } from "../types/walk";
import { BADGE_META, BadgeIcon } from "./BadgeIcon";
import { WaltzMap } from "./WaltzMap";
import { WalkTagIcons } from "./WalkTagIcons";
import { WobblyCard, WobblyDivider } from "./WobblyCard";
import type { ActivityEvent } from "../types/activity";

function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function sydneyHour(dateString: string) {
  return Number(new Intl.DateTimeFormat("en-AU", {
    hour: "2-digit",
    hour12: false,
    timeZone: "Australia/Sydney",
  }).format(new Date(dateString)));
}

export function fallbackWalkTitle(dateString: string) {
  const hour = sydneyHour(dateString);
  if (hour >= 5 && hour < 12) return "Morning waltz";
  if (hour >= 12 && hour < 18) return "Afternoon waltz";
  return "Night waltz";
}

function badgeActivityMessage(dogName: string, badgeId: string) {
  const distance = badgeId.match(/^mileage-(\d+)$/)?.[1];
  if (distance) return `${dogName} completed ${Number(distance).toLocaleString()} km`;
  return `${dogName} got the ${BADGE_META[badgeId]?.title ?? badgeId.replaceAll("-", " ")} badge`;
}

function WeatherMeta({ condition, temperatureC }: { condition: NonNullable<Walk["weather_condition"]>; temperatureC: number }) {
  const iconProps = { size: 13, strokeWidth: 2, color: "#5E6F80" } as const;
  const icon = condition === "clear"
    ? <Sun {...iconProps} />
    : condition === "cloudy" || condition === "fog"
      ? <Cloudy {...iconProps} />
      : ["drizzle", "rain", "heavy_rain", "storm"].includes(condition)
        ? <Umbrella {...iconProps} />
        : <Cloudy {...iconProps} />;

  return <View style={styles.weatherMeta}>{icon}<Text style={styles.weather}>{Math.round(temperatureC)}°</Text></View>;
}

export function MeBadgeActivityCard({ dogName, badge, wobbly = false, onMenu }: { dogName: string; badge: DogBadge; wobbly?: boolean; onMenu?: () => void }) {
  const content = <>
      <BadgeIcon badgeId={badge.badge_id} size={52} showLabel={false} />
      <View style={styles.flex}>
        <Text style={styles.badgeMessage}>{badgeActivityMessage(dogName, badge.badge_id)}</Text>
        <Text style={[styles.date, styles.eventDate]}>{new Date(badge.earned_at).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}</Text>
      </View>
      {onMenu ? <Pressable style={styles.moreButton} onPress={onMenu} hitSlop={10}><Text style={styles.moreText}>•••</Text></Pressable> : null}
    </>;
  return wobbly
    ? <WobblyCard contentStyle={styles.badgeCardWobbly}>{content}</WobblyCard>
    : <View style={styles.badgeCard}>{content}</View>;
}

function ordinal(rank: number) {
  if (rank % 100 >= 11 && rank % 100 <= 13) return `${rank}th`;
  return `${rank}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[rank % 10] ?? "th"}`;
}

export function RankingActivityCard({ dogName, event, wobbly = false, onMenu }: { dogName: string; event: ActivityEvent; wobbly?: boolean; onMenu?: () => void }) {
  const newRank = Number(event.metadata.new_rank);
  const category = event.metadata.category === "waltzes" || event.metadata.category === "places" ? event.metadata.category : "distance";
  const league = category === "distance" ? "Distance" : category === "waltzes" ? "Most Waltzes" : "New Places";
  const message = newRank === 1
    ? `${dogName} took 1st place in ${league}!`
    : `${dogName} climbed to ${ordinal(newRank)} place in ${league}!`;
  const content = <>
    <View style={styles.rankingIcon}><Trophy size={27} strokeWidth={2} color="#8A7440" /></View>
    <View style={styles.flex}>
      <Text style={styles.badgeMessage}>{message}</Text>
      <Text style={[styles.date, styles.eventDate]}>{new Date(event.created_at).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone: "Australia/Sydney" })}</Text>
    </View>
    {onMenu ? <Pressable style={styles.moreButton} onPress={onMenu} hitSlop={10}><Text style={styles.moreText}>•••</Text></Pressable> : null}
  </>;
  return wobbly
    ? <WobblyCard contentStyle={styles.badgeCardWobbly}>{content}</WobblyCard>
    : <View style={styles.badgeCard}>{content}</View>;
}

type WalkCardProps = {
  walk: Walk;
  onMenu?: () => void;
  wobbly?: boolean;
  boopCount?: number;
  booped?: boolean;
  boopBusy?: boolean;
  onBoop?: () => void;
  onPress?: () => void;
};

export function MeWalkActivityCard({ walk, onMenu, onPress, wobbly = false, boopCount, booped = false, boopBusy = false, onBoop }: WalkCardProps) {
  const points = walk.route_points ?? [];
  const [loadedBoopCount, setLoadedBoopCount] = useState(0);
  const title = walk.title?.trim() || fallbackWalkTitle(walk.ended_at);
  const visibility = walk.route_visibility ?? (walk.share_route ? "full" : "private");
  const canShowMap = visibility !== "stats_only" && points.length > 0;
  const canShowLocation = visibility !== "stats_only" && !!walk.suburb_name;
  const visibilityLabel = {
    private: "Only me",
    stats_only: "Stats only",
    hidden_ends: "Start & finish hidden",
    full: "Full route",
  }[visibility];

  useEffect(() => {
    if (boopCount !== undefined) return;
    let active = true;
    fetchBoopCountsByWalkIds([walk.id])
      .then((counts) => { if (active) setLoadedBoopCount(counts[walk.id] ?? 0); })
      .catch((error) => console.error("Load walk Boops error:", error));
    return () => { active = false; };
  }, [boopCount, walk.id]);

  const shownBoopCount = boopCount ?? loadedBoopCount;
  const content = <>
      <View style={styles.header}>
        <View style={styles.flex}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            <WalkTagIcons tags={walk.tags} />
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.date}>{new Date(walk.ended_at).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone: "Australia/Sydney" })}</Text>
            <Text style={styles.visibility}>{visibilityLabel}</Text>
            {canShowLocation ? <View style={styles.locationMeta}><MapPin size={12} strokeWidth={2} color="#78845C" /><Text style={styles.location}>{walk.suburb_name}</Text></View> : null}
            {walk.weather_temperature_c != null && walk.weather_condition
              ? <WeatherMeta condition={walk.weather_condition} temperatureC={walk.weather_temperature_c} />
              : null}
          </View>
        </View>
        {onMenu ? <Pressable style={styles.moreButton} onPress={onMenu} hitSlop={10}><Text style={styles.moreText}>•••</Text></Pressable> : null}
      </View>
      {canShowMap ? (
        <View style={styles.map}>
          <WaltzMap points={points} interactive={false} overview />
        </View>
      ) : null}
      {wobbly ? <WobblyDivider /> : null}
      <View style={[styles.metrics, wobbly && styles.metricsWobbly]}>
        <Metric icon={<Ruler size={17} strokeWidth={2} color="#78845C" />} value={`${walk.distance_km.toFixed(2)} km`} />
        <Metric icon={<Timer size={17} strokeWidth={2} color="#78845C" />} value={formatDuration(walk.duration_seconds)} />
        <Pressable
          style={[styles.metric, booped && styles.boopActive, boopBusy && styles.boopBusy]}
          onPress={onBoop}
          disabled={!onBoop || boopBusy}
          accessibilityRole={onBoop ? "button" : undefined}
          accessibilityLabel={onBoop ? (booped ? "Remove Boop" : "Boop this waltz") : undefined}
        >
          <Bone size={17} strokeWidth={2} color="#78845C" />
          <Text style={[styles.metricValue, booped && styles.boopValueActive]}>{shownBoopCount}</Text>
        </Pressable>
      </View>
    </>;

  const card = wobbly
    ? <WobblyCard contentStyle={styles.walkCardWobbly}>{content}</WobblyCard>
    : <View style={styles.walkCard}>{content}</View>;
  return onPress
    ? <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open ${title}`}>{card}</Pressable>
    : card;
}

function Metric({ icon, value }: { icon: React.ReactNode; value: string }) {
  return <View style={styles.metric}><>{icon}</><Text style={styles.metricValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  walkCard: { borderWidth: 1, borderColor: "#DDD8CF", borderRadius: 8, padding: 16, gap: 11 },
  badgeCard: { borderWidth: 1, borderColor: "#DDD8CF", borderRadius: 8, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  badgeCardWobbly: { flexDirection: "row", alignItems: "center", gap: 12 },
  rankingIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#F5E7B8", alignItems: "center", justifyContent: "center" },
  walkCardWobbly: { gap: 11 },
  badgeMessage: { fontSize: 15, fontWeight: "800", color: "#332E29", lineHeight: 21 },
  header: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { flex: 1, fontSize: 16, fontWeight: "700", color: "#1D1A17" },
  date: { fontSize: 10, color: "#82786E" },
  eventDate: { marginTop: 6 },
  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 7, marginTop: 6 },
  visibility: { fontSize: 9, fontWeight: "700", color: "#78845C" },
  locationMeta: { flexDirection: "row", alignItems: "center", gap: 2 },
  location: { fontSize: 9, fontWeight: "700", color: "#78845C" },
  weatherMeta: { flexDirection: "row", alignItems: "center", gap: 3 },
  weather: { fontSize: 9, fontWeight: "700", color: "#5E6F80" },
  moreButton: { paddingHorizontal: 5, paddingVertical: 2 },
  moreText: { fontSize: 15, fontWeight: "800", color: "#82786E", letterSpacing: 1 },
  map: { height: 128, borderRadius: 4, overflow: "hidden", backgroundColor: "#EFE8DC" },
  metrics: { flexDirection: "row", justifyContent: "flex-start", alignItems: "center", gap: 22, borderTopWidth: 1, borderTopColor: "#E5E0D8", paddingTop: 11 },
  metricsWobbly: { borderTopWidth: 0, paddingTop: 6 },
  metric: { flexDirection: "row", alignItems: "center", gap: 5 },
  metricValue: { fontSize: 12, fontWeight: "700", color: "#655D54" },
  boopActive: { opacity: 0.7 },
  boopBusy: { opacity: 0.45 },
  boopValueActive: { color: "#596442" },
});
