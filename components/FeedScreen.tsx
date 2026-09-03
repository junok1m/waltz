import { useCallback, useEffect, useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Bone, Dog as DogIcon, Maximize2, RefreshCw, Ruler, Timer, Trophy, X } from "@sketchyicons/react-native";
import { AppTab } from "./HubScreen";
import { WaltzMap } from "./WaltzMap";
import { BottomNav } from "./BottomNav";
import { fetchFeedPage, setWalkBoop } from "../services/boops";
import { Dog } from "../types/dog";
import { FeedBadgeEvent, FeedItem, FeedRankingEvent, FeedWalk } from "../types/feed";
import { Walk } from "../types/walk";
import { rankFeedItemsForViewer } from "../utils/feedRanking";
import { dogAvatarSource } from "../utils/mockDogAvatars";
import { formatTime } from "../utils/time";
import { BADGE_META, BadgeIcon } from "./BadgeIcon";
import { WalkTagIcons } from "./WalkTagIcons";
import { WobblyCard, WobblyDivider } from "./WobblyCard";

type Props = {
  dog: Dog;
  viewerWalks: Walk[];
  onNavigate: (tab: AppTab) => void;
  onStartWalk: () => void;
  onOpenDogProfile: (dogId: string) => void;
};

export function FeedScreen({ dog, viewerWalks, onNavigate, onStartWalk, onOpenDogProfile }: Props) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [busyWalkIds, setBusyWalkIds] = useState<Set<number>>(new Set());
  const [expandedWalk, setExpandedWalk] = useState<FeedWalk | null>(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const page = await fetchFeedPage(dog.id, dog.owner_id);
      setItems(rankFeedItemsForViewer(page.items, viewerWalks));
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load the feed";
      console.error("Load feed error:", error);
      Alert.alert("Feed unavailable", message);
    } finally {
      setLoading(false);
    }
  }, [dog.id, dog.owner_id, viewerWalks]);

  async function loadMore() {
    if (!nextCursor || loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchFeedPage(dog.id, dog.owner_id, nextCursor);
      setItems((current) => {
        const existing = new Set(current.map((item) => `${item.kind}-${item.id}`));
        return [...current, ...rankFeedItemsForViewer(page.items, viewerWalks).filter((item) => !existing.has(`${item.kind}-${item.id}`))];
      });
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load more activity";
      Alert.alert("Feed unavailable", message);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  async function toggleBoop(walk: FeedWalk) {
    if (walk.owner_id === dog.owner_id || busyWalkIds.has(walk.id)) return;

    setBusyWalkIds((current) => new Set(current).add(walk.id));
    setItems((current) =>
      current.map((item) =>
        item.kind === "walk" && item.id === walk.id
          ? {
              ...item,
              booped_by_me: !item.booped_by_me,
              boop_count: Math.max(0, item.boop_count + (item.booped_by_me ? -1 : 1)),
            }
          : item,
      ),
    );

    try {
      await setWalkBoop({
        fromDogId: dog.id,
        toDogId: walk.dog_id,
        walkId: walk.id,
        booped: walk.booped_by_me,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save this Boop";
      Alert.alert("Boop failed", message);
      setItems((current) =>
        current.map((item) =>
          item.kind === "walk" && item.id === walk.id
            ? { ...item, booped_by_me: walk.booped_by_me, boop_count: walk.boop_count }
            : item,
        ),
      );
    } finally {
      setBusyWalkIds((current) => {
        const next = new Set(current);
        next.delete(walk.id);
        return next;
      });
    }
  }

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <Text style={s.title}>Feed</Text>
        <Pressable style={[s.headerAction, loading && s.headerActionDisabled]} onPress={loadFeed} disabled={loading} hitSlop={8} accessibilityRole="button" accessibilityLabel="Refresh feed">
          <RefreshCw size={22} strokeWidth={2} color="#78845C" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.feed} showsVerticalScrollIndicator={false}>
        {!loading && items.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyDogs}>🐕 🐩 🦮</Text>
            <Text style={s.emptyTitle}>The feed is quiet... for now</Text>
            <Text style={s.emptyText}>Shared waltzes will appear here.</Text>
          </View>
        ) : null}

        {items.map((item) => {
          if (item.kind === "badge") return <BadgeEventCard key={`badge-${item.id}`} event={item} onDogPress={() => onOpenDogProfile(item.dog_id)} />;
          if (item.kind === "ranking") return <RankingEventCard key={`ranking-${item.id}`} event={item} onDogPress={() => onOpenDogProfile(item.dog_id)} />;
          const walk = item;
          const busy = busyWalkIds.has(walk.id);
          const avatarSource = dogAvatarSource(walk.dog_id, walk.dog_avatar_url);
          return (
            <WobblyCard key={walk.id}>
              <Pressable style={s.cardHeader} onPress={() => onOpenDogProfile(walk.dog_id)} accessibilityRole="button" accessibilityLabel={`Open ${walk.dog_name}'s profile`}>
                <View style={s.avatar}>
                  {avatarSource
                    ? <Image source={avatarSource} style={s.avatarImage} />
                    : <DogIcon size={29} strokeWidth={1.8} color="#78845C" />}
                </View>
                <View style={s.cardHeaderCopy}>
                  <Text style={s.dogName}>{walk.dog_name}</Text>
                  <Text style={s.date}>
                    {new Date(walk.ended_at).toLocaleDateString("en-AU", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </Text>
                </View>
              </Pressable>

              <View style={s.walkTitleRow}>
                <Text style={s.walkTitle}>{walk.title || `${walk.dog_name}'s waltz`}</Text>
                {walk.tags.length ? <WalkTagIcons tags={walk.tags} /> : null}
              </View>
              {walk.route_points.length ? (
                <Pressable style={s.map} onPress={() => setExpandedWalk(walk)} accessibilityRole="button" accessibilityLabel={`Open ${walk.dog_name}'s route map`}>
                  <WaltzMap points={walk.route_points} dogName={walk.dog_name} interactive={false} overview />
                  <View style={s.expandIcon}><Maximize2 size={16} strokeWidth={2} color="#655D54" /></View>
                </Pressable>
              ) : null}

              <WobblyDivider style={s.divider} />
              <View style={s.actions}>
                <View style={s.metricItem}>
                  <Ruler size={17} strokeWidth={2} color="#78845C" />
                  <Text style={s.metric}>{walk.distance_km.toFixed(2)} km</Text>
                </View>
                <View style={s.metricItem}>
                  <Timer size={17} strokeWidth={2} color="#78845C" />
                  <Text style={s.metric}>{formatTime(walk.duration_seconds)}</Text>
                </View>
                <Pressable
                  style={[
                    s.boopButton,
                    walk.booped_by_me && s.boopButtonActive,
                    busy && s.boopButtonDisabled,
                  ]}
                  disabled={busy}
                  onPress={() => toggleBoop(walk)}
                >
                  <Bone size={18} strokeWidth={2} color="#78845C" />
                  <Text style={[s.boopText, walk.booped_by_me && s.boopTextActive]}>{walk.boop_count}</Text>
                </Pressable>
              </View>
            </WobblyCard>
          );
        })}

        {hasMore ? (
          <Pressable style={[s.moreButton, (loading || loadingMore) && s.moreButtonDisabled]} onPress={loadMore} disabled={loading || loadingMore}>
            <Text style={s.moreButtonText}>{loadingMore ? "Loading…" : "More waltzes"}</Text>
          </Pressable>
        ) : items.length > 0 ? <Text style={s.endText}>You're all caught up.</Text> : null}
      </ScrollView>

      <Modal visible={expandedWalk !== null} animationType="slide" onRequestClose={() => setExpandedWalk(null)}>
        <View style={s.mapModal}>
          <View style={s.mapModalHeader}>
            <View>
              <Text style={s.mapModalTitle}>{expandedWalk?.dog_name}'s waltz</Text>
              <Text style={s.mapModalMeta}>{expandedWalk ? `${expandedWalk.distance_km.toFixed(2)} km · ${formatTime(expandedWalk.duration_seconds)}` : ""}</Text>
            </View>
            <Pressable style={s.closeMap} onPress={() => setExpandedWalk(null)} accessibilityLabel="Close route map">
              <X size={25} strokeWidth={2} color="#332E29" />
            </Pressable>
          </View>
          <View style={s.fullMap}>
            {expandedWalk ? <WaltzMap points={expandedWalk.route_points} dogName={expandedWalk.dog_name} interactive /> : null}
          </View>
        </View>
      </Modal>

      <BottomNav active="community" onNavigate={onNavigate} onStartPress={onStartWalk} />
    </View>
  );
}

function badgeMessage(event: FeedBadgeEvent) {
  const distance = event.badge_id.match(/^mileage-(\d+)$/)?.[1];
  if (distance) return `${event.dog_name} completed ${Number(distance).toLocaleString()} km`;
  return `${event.dog_name} got the ${BADGE_META[event.badge_id]?.title ?? event.badge_id.replaceAll("-", " ")} badge`;
}

function BadgeEventCard({ event, onDogPress }: { event: FeedBadgeEvent; onDogPress: () => void }) {
  return <WobblyCard contentStyle={s.badgeCardContent}>
    <BadgeIcon badgeId={event.badge_id} size={52} showLabel={false} />
    <Pressable style={s.badgeCopy} onPress={onDogPress} accessibilityRole="button" accessibilityLabel={`Open ${event.dog_name}'s profile`}>
      <Text style={s.badgeMessage}>{badgeMessage(event)}</Text>
      <Text style={s.date}>{new Date(event.created_at).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}</Text>
    </Pressable>
  </WobblyCard>;
}

function RankingEventCard({ event, onDogPress }: { event: FeedRankingEvent; onDogPress: () => void }) {
  const avatarSource = dogAvatarSource(event.dog_id, event.dog_avatar_url);
  const message = event.new_rank === 1
    ? `${event.dog_name} took 1st place in distance!`
    : `${event.dog_name} raced into the Top 3!`;
  return <WobblyCard contentStyle={s.rankingCardContent}>
    <View style={s.rankingAvatarWrap}>
      {avatarSource
        ? <Image source={avatarSource} style={s.rankingAvatarImage} />
        : <DogIcon size={29} strokeWidth={1.8} color="#78845C" />}
      <View style={s.trophyBubble}><Trophy size={15} strokeWidth={2} color="#8A7440" /></View>
    </View>
    <Pressable style={s.badgeCopy} onPress={onDogPress} accessibilityRole="button" accessibilityLabel={`Open ${event.dog_name}'s profile`}>
      <Text style={s.badgeMessage}>{message}</Text>
      <Text style={s.rankingMeta}>{event.distance_km.toFixed(1)} km this month · #{event.new_rank}</Text>
      <Text style={s.date}>{new Date(event.created_at).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone: "Australia/Sydney" })}</Text>
    </Pressable>
  </WobblyCard>;
}

const s = StyleSheet.create({
  screen: { flex: 1, justifyContent: "space-between" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 42, marginBottom: 14 },
  title: { fontFamily: "Schoolbell_400Regular", fontSize: 34, color: "#1D1A17" },
  headerAction: { paddingVertical: 8 },
  headerActionDisabled: { opacity: 0.4 },
  feed: { gap: 14, paddingBottom: 20 },
  empty: { alignItems: "center", borderWidth: 1, borderColor: "#DDD8CF", borderRadius: 8, padding: 28 },
  emptyDogs: { fontSize: 34 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#1D1A17", marginTop: 10 },
  emptyText: { fontSize: 12, color: "#756B60", marginTop: 5 },
  badgeCardContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  rankingCardContent: { flexDirection: "row", alignItems: "center", gap: 13, backgroundColor: "#FFF9E9", borderRadius: 14 },
  rankingAvatarWrap: { width: 56, height: 56 },
  rankingAvatarImage: { width: 52, height: 52, borderRadius: 26 },
  trophyBubble: { position: "absolute", right: 0, bottom: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: "#F5E7B8", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FFFDF8" },
  rankingMeta: { fontSize: 10, fontWeight: "700", color: "#8A7440", marginTop: 3 },
  badgeCopy: { flex: 1 },
  badgeMessage: { fontSize: 15, fontWeight: "800", color: "#332E29", lineHeight: 21 },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImage: { width: 42, height: 42, borderRadius: 21 },
  cardHeaderCopy: { flex: 1, marginLeft: 8 },
  dogName: { fontSize: 15, fontWeight: "800", color: "#1D1A17" },
  date: { fontSize: 10, color: "#82786E", marginTop: 2 },
  walkTitleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 18 },
  walkTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: "#332E29" },
  map: { height: 138, borderRadius: 4, overflow: "hidden", marginTop: 12 },
  expandIcon: { position: "absolute", top: 8, right: 8, width: 29, height: 29, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,253,248,.88)", borderWidth: 1, borderColor: "#DDD8CF", borderRadius: 4 },
  metric: { fontSize: 12, fontWeight: "700", color: "#655D54" },
  divider: { height: 5, marginTop: 12 },
  actions: { flexDirection: "row", alignItems: "center", gap: 22, paddingTop: 8 },
  metricItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  boopButton: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 4 },
  boopButtonActive: { opacity: 0.65 },
  boopButtonDisabled: { opacity: 0.5 },
  boopText: { fontSize: 11, fontWeight: "800", color: "#596442" },
  boopTextActive: { color: "#596442" },
  moreButton: { alignSelf: "center", borderWidth: 1, borderColor: "#CFC8BD", borderRadius: 999, paddingHorizontal: 22, paddingVertical: 11, marginTop: 4 },
  moreButtonDisabled: { opacity: 0.5 },
  moreButtonText: { fontSize: 12, fontWeight: "800", color: "#596442" },
  endText: { textAlign: "center", fontSize: 11, color: "#82786E", paddingVertical: 8 },
  mapModal: { flex: 1, backgroundColor: "#F8F3E9", paddingTop: 62, paddingHorizontal: 18, paddingBottom: 24 },
  mapModalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  mapModalTitle: { fontFamily: "Schoolbell_400Regular", fontSize: 29, color: "#1D1A17" },
  mapModalMeta: { fontSize: 11, fontWeight: "700", color: "#756B60", marginTop: 2 },
  closeMap: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  fullMap: { flex: 1, borderWidth: 1, borderColor: "#DDD8CF", borderRadius: 8, overflow: "hidden" },
});
