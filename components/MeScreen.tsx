import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Dog as DogIcon, Pencil } from "@sketchyicons/react-native";
import { monthKey } from "../services/badges";
import { DogBadge } from "../types/badge";
import { Dog } from "../types/dog";
import { Walk } from "../types/walk";
import { calculateWalkStreak } from "../utils/streak";
import { BadgeIcon } from "./BadgeIcon";
import { BottomNav } from "./BottomNav";
import { AppTab } from "./HubScreen";
import { fallbackWalkTitle, MeBadgeActivityCard, MeWalkActivityCard, RankingActivityCard } from "./MeActivityCards";
import { fetchDogProfileEvents, setActivityEventHiddenFromProfile } from "../services/activity";
import type { ActivityEvent } from "../types/activity";

type Props = {
  dog: Dog;
  walks: Walk[];
  badges: DogBadge[];
  onNavigate: (tab: AppTab) => void;
  onStartWalk: () => void;
  onEditDog: () => void;
  onOpenWalk: (id: number) => void;
  onHideWalk: (id: number) => Promise<void>;
  onDeleteWalk: (id: number) => Promise<void>;
};

type TimelineItem =
  | { kind: "walk"; date: string; walk: Walk }
  | { kind: "event"; date: string; event: ActivityEvent };

export function MeScreen({
  dog,
  walks,
  badges,
  onNavigate,
  onStartWalk,
  onEditDog,
  onOpenWalk,
  onHideWalk,
  onDeleteWalk,
}: Props) {
  const [profileEvents, setProfileEvents] = useState<ActivityEvent[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalDistance = walks.reduce((sum, walk) => sum + walk.distance_km, 0);
  const streak = calculateWalkStreak(walks);
  const activePeriod = monthKey();
  const monthlyBadges = badges.filter((badge) => badge.badge_type === "monthly" && badge.period_key === activePeriod);
  const mileageBadges = badges.filter((badge) => badge.badge_type === "mileage" && badge.period_key === activePeriod);
  const limitedBadges = badges.filter((badge) => badge.badge_type === "limited");
  const profileWalks = walks
    .filter((walk) => !walk.is_mock && !walk.hidden_from_profile)
    .sort((a, b) => new Date(b.ended_at).getTime() - new Date(a.ended_at).getTime());
  const timeline: TimelineItem[] = [
    ...profileWalks.map((walk) => ({ kind: "walk" as const, date: walk.ended_at, walk })),
    ...profileEvents.map((event) => ({ kind: "event" as const, date: event.created_at, event })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const visibleActivity = timeline.slice(0, visibleCount);
  const monthTitle = new Date().toLocaleDateString("en-AU", {
    month: "long",
    timeZone: "Australia/Sydney",
  });

  useEffect(() => {
    let active = true;
    setVisibleCount(10);
    setProfileEvents([]);
    fetchDogProfileEvents(dog.id)
      .then((events) => { if (active) setProfileEvents(events); })
      .catch((error) => console.error("Load profile activity error:", error));
    return () => { active = false; };
  }, [dog.id]);

  useEffect(() => () => {
    if (loadMoreTimer.current) clearTimeout(loadMoreTimer.current);
  }, []);

  function loadMore(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const nearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 240;
    if (!nearBottom || loadingMore || visibleCount >= timeline.length) return;
    setLoadingMore(true);
    loadMoreTimer.current = setTimeout(() => {
      setVisibleCount((count) => Math.min(count + 10, timeline.length));
      setLoadingMore(false);
      loadMoreTimer.current = null;
    }, 250);
  }

  function openWalkMenu(walk: Walk) {
    const title = walk.title?.trim() || fallbackWalkTitle(walk.ended_at);
    Alert.alert(title, "What would you like to do?", [
      {
        text: "Hide from profile",
        onPress: () => onHideWalk(walk.id).catch((error) => {
          Alert.alert("Couldn't hide waltz", error instanceof Error ? error.message : "Unknown error");
        }),
      },
      {
        text: "Delete waltz",
        style: "destructive",
        onPress: () => confirmDelete(walk),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  function confirmDelete(walk: Walk) {
    Alert.alert("Delete this waltz?", "This removes it from Report and your stats too.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => onDeleteWalk(walk.id).catch((error) => {
          Alert.alert("Couldn't delete waltz", error instanceof Error ? error.message : "Unknown error");
        }),
      },
    ]);
  }

  function openEventMenu(event: ActivityEvent) {
    Alert.alert("Activity", "What would you like to do?", [
      {
        text: "Hide from profile",
        onPress: () => setActivityEventHiddenFromProfile(event.id, true)
          .then(() => setProfileEvents((current) => current.filter((item) => item.id !== event.id)))
          .catch((error) => Alert.alert("Couldn't hide activity", error instanceof Error ? error.message : "Unknown error")),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{dog.name}</Text>
        <Pressable style={styles.editButton} onPress={onEditDog} hitSlop={8} accessibilityRole="button" accessibilityLabel="Edit profile">
          <Pencil size={22} strokeWidth={2} color="#78845C" />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} onScroll={loadMore} scrollEventThrottle={160}>
        <View style={styles.profile}>
          {dog.avatar_url
            ? <Image source={{ uri: dog.avatar_url }} style={styles.avatarImage} />
            : <View style={styles.avatarFallback}><DogIcon size={42} strokeWidth={2} color="#665D54" /></View>}
          <Text style={styles.profileLine}>{dog.profile_line || "Very good dog"}</Text>
          <Text style={styles.summary}>{walks.length} waltzes · {totalDistance.toFixed(1)} km · {streak} day streak</Text>
        </View>

        <Text style={styles.sectionTitle}>{monthTitle} Badges</Text>
        <Text style={styles.sectionCopy}>
          {monthlyBadges.length ? `${monthlyBadges.length} collected this month` : "A fresh sticker book for a new month."}
        </Text>
        {monthlyBadges.length ? <BadgeRow badges={monthlyBadges} /> : null}

        {mileageBadges.length ? (
          <>
            <Text style={styles.sectionTitle}>{monthTitle} Mileage Clubs</Text>
            <Text style={styles.sectionCopy}>Monthly distance milestones. A fresh start next month.</Text>
            <BadgeRow badges={mileageBadges} />
          </>
        ) : null}

        {limitedBadges.length ? (
          <>
            <Text style={styles.sectionTitle}>Limited Keepsakes</Text>
            <Text style={styles.sectionCopy}>Little pieces of Waltz history.</Text>
            <BadgeRow badges={limitedBadges} />
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Recent activity</Text>
        <Text style={styles.sectionCopy}>Waltzes and tiny victories from {dog.name}, newest first.</Text>
        {visibleActivity.length ? visibleActivity.map((item) => (
          item.kind === "walk"
            ? <MeWalkActivityCard key={`walk-${item.walk.id}`} walk={item.walk} onPress={() => onOpenWalk(item.walk.id)} onMenu={() => openWalkMenu(item.walk)} wobbly />
            : item.event.event_type === "badge_earned" && item.event.badge_id
              ? <MeBadgeActivityCard
                  key={`event-${item.event.id}`}
                  dogName={dog.name}
                  badge={{ id: item.event.id, dog_id: dog.id, badge_id: item.event.badge_id, badge_type: item.event.badge_id.startsWith("mileage-") ? "mileage" : "monthly", period_key: activePeriod, earned_at: item.event.created_at }}
                  wobbly
                  onMenu={() => openEventMenu(item.event)}
                />
              : <RankingActivityCard key={`event-${item.event.id}`} dogName={dog.name} event={item.event} wobbly onMenu={() => openEventMenu(item.event)} />
        )) : (
          <View style={styles.empty}><Text style={styles.emptyText}>No activity yet. Your first waltz or badge will appear here.</Text></View>
        )}
        {loadingMore ? <ActivityIndicator style={styles.loadingMore} color="#78845C" /> : null}
      </ScrollView>
      <BottomNav active="me" onNavigate={onNavigate} onStartPress={onStartWalk} />
    </View>
  );
}

function BadgeRow({ badges }: { badges: DogBadge[] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeRow}>
      {badges.map((badge) => <BadgeIcon key={badge.id} badgeId={badge.badge_id} />)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "space-between" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 42, marginBottom: 14 },
  title: { fontFamily: "Schoolbell_400Regular", fontSize: 34, color: "#1D1A17" },
  content: { paddingBottom: 24, gap: 14 },
  profile: { alignItems: "center", paddingVertical: 10 },
  avatarImage: { width: 92, height: 92, borderRadius: 46 },
  avatarFallback: { width: 92, height: 92, borderRadius: 46, backgroundColor: "#F1E7D7", alignItems: "center", justifyContent: "center" },
  profileLine: { fontSize: 14, color: "#655D54", marginTop: 10 },
  summary: { fontSize: 12, fontWeight: "700", color: "#78845C", marginTop: 9 },
  editButton: { paddingVertical: 8 },
  sectionTitle: { fontFamily: "Schoolbell_400Regular", fontSize: 27, color: "#1D1A17", marginTop: 8 },
  sectionCopy: { fontSize: 11, color: "#756B60", marginTop: -8, lineHeight: 16 },
  badgeRow: { gap: 10, paddingVertical: 3, paddingRight: 10 },
  empty: { padding: 22, borderRadius: 8, borderWidth: 1, borderColor: "#DDD8CF" },
  emptyText: { color: "#655D54", lineHeight: 19 },
  loadingMore: { paddingVertical: 12 },
});
