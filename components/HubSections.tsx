import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Balloon, Bird, Coffee, Fish, Flag, Flame, Footprints, MoonStar, Mountain, Route, Ruler, Timer, Umbrella } from "@sketchyicons/react-native";
import { Dog } from "../types/dog";
import { Walk, WalkTag } from "../types/walk";
import { calculateWalkStreak } from "../utils/streak";
import { monthKey } from "../utils/badgeLogic";
import { dogAvatarSource } from "../utils/mockDogAvatars";
import { fetchMonthlyDogRanking } from "../services/ranking";
import type { MonthlyDogRank, RankingCategory } from "../services/ranking";

export type ChallengeInfo = {
  id: string;
  title: string;
  progress: string;
  description: string;
  done: boolean;
  icon: React.ReactNode;
  color: string;
};

function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function HubStats({ walks }: { walks: Walk[] }) {
  const distance = walks.reduce((sum, walk) => sum + walk.distance_km, 0);
  const seconds = walks.reduce((sum, walk) => sum + walk.duration_seconds, 0);
  const longest = walks.reduce((best, walk) => Math.max(best, walk.distance_km), 0);
  return (
    <View style={styles.grid}>
      <Stat label="Walks" value={`${walks.length}`} icon={<Footprints size={29} strokeWidth={2} color="#78845C" />} />
      <Stat label="Distance" value={`${distance.toFixed(1)} km`} icon={<Ruler size={29} strokeWidth={2} color="#78845C" />} />
      <Stat label="Time" value={formatDuration(seconds)} icon={<Timer size={29} strokeWidth={2} color="#78845C" />} />
      <Stat label="Longest" value={`${longest.toFixed(1)} km`} icon={<Route size={29} strokeWidth={2} color="#78845C" />} />
    </View>
  );
}

export function HubLeaderboard({ dog }: { walks: Walk[]; dog: Dog }) {
  const [ranking, setRanking] = useState<MonthlyDogRank[]>([]);
  const [category, setCategory] = useState<RankingCategory>("distance");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const month = new Date().toLocaleDateString("en-AU", {
    month: "long",
    timeZone: "Australia/Sydney",
  });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setFailed(false);
    fetchMonthlyDogRanking()
      .then((rows) => {
        if (active) setRanking(rows);
      })
      .catch((error) => {
        console.error("Load monthly ranking error:", error);
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <View style={styles.rankingStatus}><ActivityIndicator color="#78845C" /><Text style={styles.muted}>Counting paws and kilometres…</Text></View>;
  }

  if (failed) {
    return <View style={styles.empty}><Text style={styles.emptyText}>Couldn’t load the league right now. Try opening Ranking again.</Text></View>;
  }

  const categories: { id: RankingCategory; label: string }[] = [
    { id: "distance", label: "Distance" },
    { id: "waltzes", label: "Waltzes" },
    { id: "places", label: "Places" },
  ];
  const rankFor = (entry: MonthlyDogRank) => category === "distance"
    ? entry.distance_rank
    : category === "waltzes"
      ? entry.waltzes_rank
      : entry.places_rank;
  const sortedRanking = [...ranking].sort((a, b) => rankFor(a) - rankFor(b));
  const metricFor = (entry: MonthlyDogRank) => {
    if (category === "distance") return `${entry.distance_km.toFixed(1)} km`;
    if (category === "waltzes") return `${entry.walk_count} waltz${entry.walk_count === 1 ? "" : "es"}`;
    return `${entry.places_count} new place${entry.places_count === 1 ? "" : "s"}`;
  };
  const detailFor = (entry: MonthlyDogRank) => category === "distance"
    ? `${entry.walk_count} waltz${entry.walk_count === 1 ? "" : "es"}`
    : category === "waltzes"
      ? `${entry.distance_km.toFixed(1)} km walked`
      : `${entry.distance_km.toFixed(1)} km walked`;

  return (
    <>
      <Text style={styles.kicker}>{month.toUpperCase()} LEAGUE · GLOBAL</Text>
      <Text style={styles.rankingCopy}>Every waltz counts. Rankings reset on the first of each month.</Text>
      <View style={styles.rankingTabs}>
        {categories.map((item) => (
          <Pressable
            key={item.id}
            style={[styles.rankingTab, category === item.id && styles.rankingTabActive]}
            onPress={() => setCategory(item.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: category === item.id }}
          >
            <Text style={[styles.rankingTabText, category === item.id && styles.rankingTabTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      {category === "places" ? <Text style={styles.placesHint}>New places means first-ever discoveries made this month.</Text> : null}
      <View style={styles.rankingList}>
        {sortedRanking.map((entry) => {
          const isCurrentDog = entry.dog_id === dog.id;
          const avatarSource = dogAvatarSource(entry.dog_id, entry.avatar_url);
          const rank = rankFor(entry);
          const rankLabel = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
          return (
            <View key={entry.dog_id} style={[styles.rankingRow, isCurrentDog && styles.currentDogRow]}>
              <Text style={styles.rank}>{rankLabel}</Text>
              <View style={styles.rankingAvatar}>
                {avatarSource
                  ? <Image source={avatarSource} style={styles.rankingAvatarImage} />
                  : <Text style={styles.avatarInitial}>{entry.dog_name.slice(0, 1)}</Text>}
              </View>
              <View style={styles.rankingDog}>
                <Text style={styles.rankingName}>{entry.dog_name}{isCurrentDog ? " · You" : ""}</Text>
                <Text style={styles.rankingWalks}>{detailFor(entry)}</Text>
              </View>
              <Text style={styles.rankingDistance}>{metricFor(entry)}</Text>
            </View>
          );
        })}
      </View>
    </>
  );
}

export function HubChallenges({ walks, dog, onSelect }: { walks: Walk[]; dog: Dog; onSelect: (challenge: ChallengeInfo) => void }) {
  const activeMonth = monthKey();
  const monthlyWalks = walks.filter((walk) => monthKey(walk.ended_at) === activeMonth);
  const totalDistance = monthlyWalks.reduce((sum, walk) => sum + walk.distance_km, 0);
  const streak = calculateWalkStreak(monthlyWalks);
  const earlyBirdWalks = monthlyWalks.filter((walk) => new Date(walk.ended_at).getHours() < 8).length;
  const nightShiftWalks = monthlyWalks.filter((walk) => new Date(walk.ended_at).getHours() >= 20).length;
  const taggedWalks = (tag: WalkTag) => monthlyWalks.filter((walk) => walk.tags?.includes(tag)).length;
  const badges: ChallengeInfo[] = [
    { id: "keep-flame", title: "Keep the flame", progress: `${Math.min(streak, 7)}/7`, description: "Complete a walk on 7 consecutive days.", done: streak >= 7, icon: <Flame size={31} strokeWidth={2} color="#E87859" />, color: "#F7DDD4" },
    { id: "tiny-adventures", title: "Tiny adventures", progress: `${Math.min(monthlyWalks.length, 10)}/10`, description: "Complete 10 walks this month.", done: monthlyWalks.length >= 10, icon: <Balloon size={31} strokeWidth={2} color="#6F7D54" />, color: "#E5EBDD" },
    { id: "trail", title: "Trail", progress: `${Math.min(taggedWalks("trail"), 5)}/5`, description: "Complete 5 walks tagged as Trail.", done: taggedWalks("trail") >= 5, icon: <Mountain size={31} strokeWidth={2} color="#796B54" />, color: "#EEE0C8" },
    { id: "gone-fishing", title: "Gone fishing", progress: `${Math.min(taggedWalks("swim"), 5)}/5`, description: "Have a swim or splash on 5 walks and tag them Gone fishing.", done: taggedWalks("swim") >= 5, icon: <Fish size={31} strokeWidth={2} color="#557784" />, color: "#DDEAF0" },
    { id: "coffee-stop", title: "Coffee stop", progress: `${Math.min(taggedWalks("coffee"), 10)}/10`, description: "Make a coffee stop on 10 walks.", done: taggedWalks("coffee") >= 10, icon: <Coffee size={31} strokeWidth={2} color="#806451" />, color: "#EADDD2" },
    { id: "early-bird", title: "Early bird", progress: `${Math.min(earlyBirdWalks, 3)}/3`, description: "Complete 3 walks before 8am.", done: earlyBirdWalks >= 3, icon: <Bird size={31} strokeWidth={2} color="#7A6F51" />, color: "#F6EBC4" },
    { id: "night-shift", title: "Night shift", progress: `${Math.min(nightShiftWalks, 3)}/3`, description: "Complete 3 walks after 8pm.", done: nightShiftWalks >= 3, icon: <MoonStar size={31} strokeWidth={2} color="#666584" />, color: "#E3E0F1" },
    { id: "rainy-day", title: "Rainy day", progress: "0/1", description: "Complete a walk while it is raining. Automatic weather detection is coming soon.", done: false, icon: <Umbrella size={31} strokeWidth={2} color="#5D7680" />, color: "#DDE8EA" },
  ];
  const mileage: ChallengeInfo[] = [1, 10, 30, 50].map((km, index) => ({
    id: `mileage-${km}`,
    title: `First ${km.toLocaleString()} km`,
    progress: `${Math.min(totalDistance, km).toFixed(1)}/${km.toLocaleString()} km`,
    description: `Walk ${km.toLocaleString()} km with ${dog.name} this month.`,
    done: totalDistance >= km,
    icon: <Flag size={30} strokeWidth={2} color="#687455" />,
    color: ["#E5EBDD", "#F6EBC4", "#F1DCD3", "#DDE8EA"][index],
  }));

  return (
    <>
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Badges</Text><Text style={styles.sectionCopy}>A fresh set of goals every month.</Text></View>
      <View style={styles.badgeGrid}>{badges.map((challenge) => <Badge key={challenge.id} challenge={challenge} onPress={() => onSelect(challenge)} />)}</View>
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Monthly mileage</Text><Text style={styles.sectionCopy}>Tiny paws, suspiciously large numbers. Resets each month.</Text></View>
      <View style={styles.mileageGrid}>{mileage.map((challenge) => <MileageBadge key={challenge.id} challenge={challenge} onPress={() => onSelect(challenge)} />)}</View>
    </>
  );
}

function Badge({ challenge, onPress }: { challenge: ChallengeInfo; onPress: () => void }) {
  return <Pressable style={styles.badgeItem} onPress={onPress}><View style={[styles.badgeCircle, challenge.done && { backgroundColor: challenge.color, borderColor: challenge.color }]}>{challenge.icon}</View><Text numberOfLines={1} style={styles.badgeTitle}>{challenge.title}</Text><Text style={styles.badgeProgress}>{challenge.progress}</Text></Pressable>;
}
function MileageBadge({ challenge, onPress }: { challenge: ChallengeInfo; onPress: () => void }) {
  return <Pressable style={styles.mileageItem} onPress={onPress}><View style={[styles.mileageCircle, challenge.done && { backgroundColor: challenge.color, borderColor: challenge.color }]}>{challenge.icon}</View><Text style={styles.mileageTitle}>{challenge.title.replace("First ", "")}</Text><Text style={styles.badgeProgress}>{challenge.progress}</Text></Pressable>;
}
function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <View style={styles.stat}><View style={styles.statIcon}>{icon}</View><Text style={styles.muted}>{label}</Text><Text style={styles.statValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  kicker: { fontSize: 12, fontWeight: "800", letterSpacing: 1.5, color: "#8C9670", marginBottom: 2 },
  big: { fontSize: 25, fontWeight: "800", color: "#1D1A17", marginTop: 8 },
  muted: { color: "#756B60", marginTop: 4 },
  empty: { padding: 22, borderRadius: 22, backgroundColor: "#F1E7D7" },
  emptyText: { color: "#655D54", lineHeight: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stat: { width: "48%", minHeight: 140, backgroundColor: "#FFFDF8", borderRadius: 24, padding: 18, justifyContent: "center" },
  statIcon: { height: 32, justifyContent: "center", marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: "800", color: "#1D1A17", marginTop: 5 },
  rankingCopy: { fontSize: 12, lineHeight: 18, color: "#756B60", marginBottom: 4 },
  rankingTabs: { flexDirection: "row", backgroundColor: "#E9E3D8", borderRadius: 999, padding: 4, marginVertical: 10 },
  rankingTab: { flex: 1, minHeight: 36, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  rankingTabActive: { backgroundColor: "#FFFDF8" },
  rankingTabText: { fontSize: 11, fontWeight: "800", color: "#82786E" },
  rankingTabTextActive: { color: "#596442" },
  placesHint: { fontSize: 10, lineHeight: 15, color: "#756B60", marginBottom: 8 },
  rankingStatus: { minHeight: 180, alignItems: "center", justifyContent: "center", gap: 10 },
  rankingList: { gap: 8 },
  rankingRow: { minHeight: 70, flexDirection: "row", alignItems: "center", backgroundColor: "#FFFDF8", borderRadius: 18, paddingHorizontal: 13, paddingVertical: 10, borderWidth: 1, borderColor: "#E5E0D8" },
  currentDogRow: { backgroundColor: "#EEF1E6", borderColor: "#AAB48D" },
  rank: { width: 36, fontSize: 16, fontWeight: "800", color: "#655D54", textAlign: "center" },
  rankingAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#E9E3D8", alignItems: "center", justifyContent: "center", overflow: "hidden", marginHorizontal: 9 },
  rankingAvatarImage: { width: 44, height: 44, borderRadius: 22 },
  avatarInitial: { fontFamily: "Schoolbell_400Regular", fontSize: 24, color: "#655D54" },
  rankingDog: { flex: 1 },
  rankingName: { fontSize: 14, fontWeight: "800", color: "#332E29" },
  rankingWalks: { fontSize: 10, color: "#82786E", marginTop: 3 },
  rankingDistance: { fontSize: 14, fontWeight: "800", color: "#596442" },
  sectionHeader: { marginTop: 4, marginBottom: 4 },
  sectionTitle: { fontFamily: "Schoolbell_400Regular", fontSize: 27, color: "#1D1A17", marginTop: 8 },
  sectionCopy: { fontSize: 11, color: "#756B60", marginTop: 1 },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 20, columnGap: 8, justifyContent: "flex-start", marginBottom: 18 },
  badgeItem: { width: "23%", alignItems: "center" },
  badgeCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: "#CFC5B7", backgroundColor: "#FFFDF8", alignItems: "center", justifyContent: "center" },
  badgeTitle: { fontSize: 10, fontWeight: "800", color: "#332E29", marginTop: 7, maxWidth: 82, textAlign: "center" },
  badgeProgress: { fontSize: 9, color: "#82786E", marginTop: 2 },
  mileageGrid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  mileageItem: { width: "23%", alignItems: "center" },
  mileageCircle: { width: 66, height: 66, borderRadius: 33, borderWidth: 2, borderColor: "#CFC5B7", backgroundColor: "#FFFDF8", alignItems: "center", justifyContent: "center" },
  mileageTitle: { fontSize: 11, fontWeight: "800", color: "#332E29", marginTop: 7 },
});
