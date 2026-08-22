import { useCallback, useEffect, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Bone, ChartBar, Dog as DogIcon, House, Maximize2, PawPrint, Rss, Ruler, Timer, X } from "@sketchyicons/react-native";
import { AppTab } from "./HubScreen";
import { WaltzMap } from "./WaltzMap";
import { fetchFeedPage, setWalkBoop } from "../services/boops";
import { Dog } from "../types/dog";
import { FeedBadgeEvent, FeedItem, FeedWalk } from "../types/feed";
import { formatTime } from "../utils/time";
import { BADGE_META, BadgeIcon } from "./BadgeIcon";

type Props = {
  dog: Dog;
  onNavigate: (tab: AppTab) => void;
  onStartWalk: (shareRoute: boolean) => void;
};

export function FeedScreen({ dog, onNavigate, onStartWalk }: Props) {
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
      setItems(page.items);
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load the feed";
      console.error("Load feed error:", error);
      Alert.alert("Feed unavailable", message);
    } finally {
      setLoading(false);
    }
  }, [dog.id, dog.owner_id]);

  async function loadMore() {
    if (!nextCursor || loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchFeedPage(dog.id, dog.owner_id, nextCursor);
      setItems((current) => {
        const existing = new Set(current.map((item) => `${item.kind}-${item.id}`));
        return [...current, ...page.items.filter((item) => !existing.has(`${item.kind}-${item.id}`))];
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
        <Pressable onPress={loadFeed} disabled={loading}>
          <Text style={s.refresh}>{loading ? "Loading…" : "Refresh"}</Text>
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
          if (item.kind === "badge") return <BadgeEventCard key={`badge-${item.id}`} event={item} />;
          const walk = item;
          const busy = busyWalkIds.has(walk.id);
          return (
            <View key={walk.id} style={s.card}>
              <View style={s.cardHeader}>
                <View style={s.avatar}><DogIcon size={25} strokeWidth={1.8} color="#78845C" /></View>
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
              </View>

              <Text style={s.walkTitle}>{walk.title || `${walk.dog_name}'s waltz`}</Text>
              {walk.route_points.length ? (
                <Pressable style={s.map} onPress={() => setExpandedWalk(walk)} accessibilityRole="button" accessibilityLabel={`Open ${walk.dog_name}'s route map`}>
                  <WaltzMap points={walk.route_points} dogName={walk.dog_name} interactive={false} overview />
                  <View style={s.expandIcon}><Maximize2 size={16} strokeWidth={2} color="#655D54" /></View>
                </Pressable>
              ) : null}

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
            </View>
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

      <View style={s.nav}>
        <Nav icon={<House size={22} strokeWidth={2} color="#332E29" />} label="Home" onPress={() => onNavigate("home")} />
        <Nav icon={<ChartBar size={22} strokeWidth={2} color="#332E29" />} label="Report" onPress={() => onNavigate("map")} />
        <Pressable style={s.pawButton} onPress={() => onStartWalk(false)}><PawPrint size={27} strokeWidth={2} color="#FFFDF8" /></Pressable>
        <Nav icon={<Rss size={22} strokeWidth={2} color="#78845C" />} label="Feed" active onPress={() => onNavigate("community")} />
        <Nav icon={<DogIcon size={22} strokeWidth={2} color="#332E29" />} label="Me" onPress={() => onNavigate("me")} />
      </View>
    </View>
  );
}

function badgeMessage(event: FeedBadgeEvent) {
  const distance = event.badge_id.match(/^mileage-(\d+)$/)?.[1];
  if (distance) return `${event.dog_name} completed ${Number(distance).toLocaleString()} km`;
  return `${event.dog_name} got the ${BADGE_META[event.badge_id]?.title ?? event.badge_id.replaceAll("-", " ")} badge`;
}

function BadgeEventCard({ event }: { event: FeedBadgeEvent }) {
  return <View style={s.badgeCard}>
    <BadgeIcon badgeId={event.badge_id} size={52} showLabel={false} />
    <View style={s.badgeCopy}>
      <Text style={s.badgeMessage}>{badgeMessage(event)}</Text>
      <Text style={s.date}>{new Date(event.created_at).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}</Text>
    </View>
  </View>;
}

function Nav({ icon, label, active, onPress }: { icon: React.ReactNode; label: string; active?: boolean; onPress: () => void }) {
  return <Pressable style={s.navItem} onPress={onPress}>{icon}<Text style={[s.navLabel, active && s.active]}>{label}</Text></Pressable>;
}

const s = StyleSheet.create({
  screen: { flex: 1, justifyContent: "space-between" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  title: { fontFamily: "Schoolbell_400Regular", fontSize: 34, color: "#1D1A17" },
  refresh: { fontSize: 11, fontWeight: "800", color: "#78845C" },
  feed: { gap: 14, paddingBottom: 20 },
  empty: { alignItems: "center", borderWidth: 1, borderColor: "#DDD8CF", borderRadius: 8, padding: 28 },
  emptyDogs: { fontSize: 34 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#1D1A17", marginTop: 10 },
  emptyText: { fontSize: 12, color: "#756B60", marginTop: 5 },
  card: { borderWidth: 1, borderColor: "#DDD8CF", borderRadius: 8, padding: 16 },
  badgeCard: { borderWidth: 1, borderColor: "#DDD8CF", borderRadius: 8, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  badgeCopy: { flex: 1 },
  badgeMessage: { fontSize: 15, fontWeight: "800", color: "#332E29", lineHeight: 21 },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  cardHeaderCopy: { flex: 1, marginLeft: 8 },
  dogName: { fontSize: 15, fontWeight: "800", color: "#1D1A17" },
  date: { fontSize: 10, color: "#82786E", marginTop: 2 },
  walkTitle: { fontSize: 17, fontWeight: "700", color: "#332E29", marginTop: 16 },
  map: { height: 138, borderRadius: 4, overflow: "hidden", marginTop: 12 },
  expandIcon: { position: "absolute", top: 8, right: 8, width: 29, height: 29, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,253,248,.88)", borderWidth: 1, borderColor: "#DDD8CF", borderRadius: 4 },
  metric: { fontSize: 12, fontWeight: "700", color: "#655D54" },
  actions: { flexDirection: "row", alignItems: "center", gap: 22, borderTopWidth: 1, borderTopColor: "#E5E0D8", marginTop: 14, paddingTop: 11 },
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
  nav: { height: 68, borderRadius: 25, backgroundColor: "#FFFDF8", flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  navItem: { width: 58, alignItems: "center" },
  navLabel: { fontSize: 9, color: "#443D37", marginTop: 2 },
  active: { color: "#78845C", fontWeight: "800" },
  pawButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#89936B", alignItems: "center", justifyContent: "center", marginTop: -20 },
});
