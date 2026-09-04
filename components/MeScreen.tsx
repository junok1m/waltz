import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, Share as NativeShare, StyleSheet, Text, View } from "react-native";
import { Pencil, Share2 } from "@sketchyicons/react-native";
import { monthKey } from "../services/badges";
import { DogBadge } from "../types/badge";
import { Dog } from "../types/dog";
import { Walk } from "../types/walk";
import { BadgeIcon } from "./BadgeIcon";
import { BottomNav } from "./BottomNav";
import { DogProfileHero } from "./DogProfileHero";
import { AppTab } from "./HubScreen";
import { fallbackWalkTitle, MeBadgeActivityCard, MeWalkActivityCard, RankingActivityCard } from "./MeActivityCards";
import { fetchDogProfileEvents, setActivityEventHiddenFromProfile } from "../services/activity";
import { fetchBoopCountsByWalkIds } from "../services/boops";
import type { ActivityEvent } from "../types/activity";
import { profileStamps } from "../utils/profileStamps";

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
  const [totalBoops, setTotalBoops] = useState(0);
  const loadMoreTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalDistance = walks.reduce((sum, walk) => sum + walk.distance_km, 0);
  const profileWalks = walks
    .filter((walk) => !walk.is_mock && !walk.hidden_from_profile)
    .sort((a, b) => new Date(b.ended_at).getTime() - new Date(a.ended_at).getTime());
  const timeline: TimelineItem[] = [
    ...profileWalks.map((walk) => ({ kind: "walk" as const, date: walk.ended_at, walk })),
    ...profileEvents.map((event) => ({ kind: "event" as const, date: event.created_at, event })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const visibleActivity = timeline.slice(0, visibleCount);
  const welcomeBadge: DogBadge | null = walks.length > 0 && !badges.some((badge) => badge.badge_id === "limited-welcome-to-waltz") ? {
    id: -1,
    dog_id: dog.id,
    badge_id: "limited-welcome-to-waltz",
    badge_type: "limited",
    period_key: "permanent",
    earned_at: walks.reduce((first, walk) => walk.ended_at < first ? walk.ended_at : first, walks[0].ended_at),
  } : null;
  const stamps = profileStamps(welcomeBadge ? [welcomeBadge, ...badges] : badges);

  useEffect(() => {
    let active = true;
    setVisibleCount(10);
    setProfileEvents([]);
    fetchDogProfileEvents(dog.id)
      .then((events) => { if (active) setProfileEvents(events); })
      .catch((error) => console.error("Load profile activity error:", error));
    return () => { active = false; };
  }, [dog.id]);

  useEffect(() => {
    let active = true;
    fetchBoopCountsByWalkIds(walks.map((walk) => walk.id))
      .then((counts) => {
        if (active) setTotalBoops(Object.values(counts).reduce((sum, count) => sum + count, 0));
      })
      .catch((error) => console.error("Load profile Boops error:", error));
    return () => { active = false; };
  }, [dog.id, walks]);

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

  function shareProfile() {
    void NativeShare.share({
      title: `${dog.name} on Waltz`,
      message: `This is ${dog.name}'s Waltz profile 🐾\n${walks.length} waltzes · ${totalDistance.toFixed(1)} km\nFollow our waltzes on Waltz!`,
    });
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerButton} onPress={shareProfile} hitSlop={8} accessibilityRole="button" accessibilityLabel="Share profile">
            <Share2 size={22} strokeWidth={2} color="#78845C" />
          </Pressable>
          <Pressable style={styles.headerButton} onPress={onEditDog} hitSlop={8} accessibilityRole="button" accessibilityLabel="Edit profile">
            <Pencil size={22} strokeWidth={2} color="#78845C" />
          </Pressable>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} onScroll={loadMore} scrollEventThrottle={160}>
        <DogProfileHero dog={dog} totalWaltzes={walks.length} totalDistance={totalDistance} totalBoops={totalBoops} />

        {stamps.length ? (
          <View>
            <Text style={styles.sectionTitle}>Stamps</Text>
            <View style={styles.badges}>{stamps.map((badge) => <BadgeIcon key={badge.badge_id} badgeId={badge.badge_id} size={48} showLabel={false} count={badge.badge_type === "monthly" ? badge.count : 1} />)}</View>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Recent activity</Text>
        {visibleActivity.length ? visibleActivity.map((item) => (
          item.kind === "walk"
            ? <MeWalkActivityCard key={`walk-${item.walk.id}`} walk={item.walk} onPress={() => onOpenWalk(item.walk.id)} onMenu={() => openWalkMenu(item.walk)} wobbly />
            : item.event.event_type === "badge_earned" && item.event.badge_id
              ? <MeBadgeActivityCard
                  key={`event-${item.event.id}`}
                  dogName={dog.name}
                  badge={{ id: item.event.id, dog_id: dog.id, badge_id: item.event.badge_id, badge_type: item.event.badge_id.startsWith("mileage-") ? "mileage" : "monthly", period_key: monthKey(item.event.created_at), earned_at: item.event.created_at }}
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

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "space-between" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", minHeight: 42, marginBottom: 14 },
  content: { paddingBottom: 24, gap: 14 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 16 },
  headerButton: { paddingVertical: 8 },
  sectionTitle: { fontFamily: "Schoolbell_400Regular", fontSize: 27, color: "#1D1A17", marginTop: 8 },
  badges: { flexDirection: "row", flexWrap: "wrap", columnGap: 12, rowGap: 12, marginTop: 10 },
  empty: { padding: 22, borderRadius: 8, borderWidth: 1, borderColor: "#DDD8CF" },
  emptyText: { color: "#655D54", lineHeight: 19 },
  loadingMore: { paddingVertical: 12 },
});
