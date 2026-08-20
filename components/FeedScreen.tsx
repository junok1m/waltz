import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Bone, ChartBar, Dog as DogIcon, House, PawPrint, Rss } from "@sketchyicons/react-native";
import { AppTab } from "./HubScreen";
import { WaltzMap } from "./WaltzMap";
import { fetchFeedWalks, setWalkBoop } from "../services/boops";
import { Dog } from "../types/dog";
import { FeedWalk } from "../types/feed";
import { formatTime } from "../utils/time";

type Props = {
  dog: Dog;
  onNavigate: (tab: AppTab) => void;
  onStartWalk: (shareRoute: boolean) => void;
};

export function FeedScreen({ dog, onNavigate, onStartWalk }: Props) {
  const [walks, setWalks] = useState<FeedWalk[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyWalkIds, setBusyWalkIds] = useState<Set<number>>(new Set());

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      setWalks(await fetchFeedWalks(dog.id, dog.owner_id));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load the feed";
      console.error("Load feed error:", error);
      Alert.alert("Feed unavailable", message);
    } finally {
      setLoading(false);
    }
  }, [dog.id, dog.owner_id]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  async function toggleBoop(walk: FeedWalk) {
    if (walk.owner_id === dog.owner_id || busyWalkIds.has(walk.id)) return;

    setBusyWalkIds((current) => new Set(current).add(walk.id));
    setWalks((current) =>
      current.map((item) =>
        item.id === walk.id
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
      await loadFeed();
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
        {!loading && walks.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyDogs}>🐕 🐩 🦮</Text>
            <Text style={s.emptyTitle}>The feed is quiet... for now</Text>
            <Text style={s.emptyText}>Shared waltzes will appear here.</Text>
          </View>
        ) : null}

        {walks.map((walk) => {
          const busy = busyWalkIds.has(walk.id);
          return (
            <View key={walk.id} style={s.card}>
              <View style={s.cardHeader}>
                <View style={s.avatar}><Text style={s.avatarText}>🐕</Text></View>
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
                <View style={s.map}>
                  <WaltzMap points={walk.route_points} dogName={walk.dog_name} interactive={false} />
                </View>
              ) : null}
              <View style={s.metrics}>
                <Text style={s.metric}>{walk.distance_km.toFixed(2)} km</Text>
                <Text style={s.dot}>·</Text>
                <Text style={s.metric}>{formatTime(walk.duration_seconds)}</Text>
              </View>

              <View style={s.actions}>
                <Pressable
                  style={[
                    s.boopButton,
                    walk.booped_by_me && s.boopButtonActive,
                    busy && s.boopButtonDisabled,
                  ]}
                  disabled={busy}
                  onPress={() => toggleBoop(walk)}
                >
                  <Bone size={18} strokeWidth={2} color={walk.booped_by_me ? "#FFFDF8" : "#78845C"} />
                  <Text style={[s.boopText, walk.booped_by_me && s.boopTextActive]}>
                    {walk.booped_by_me ? "Booped" : "Boop"}
                  </Text>
                </Pressable>
                <Text style={s.boopCount}>{walk.boop_count} boop{walk.boop_count === 1 ? "" : "s"}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

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

function Nav({ icon, label, active, onPress }: { icon: React.ReactNode; label: string; active?: boolean; onPress: () => void }) {
  return <Pressable style={s.navItem} onPress={onPress}>{icon}<Text style={[s.navLabel, active && s.active]}>{label}</Text></Pressable>;
}

const s = StyleSheet.create({
  screen: { flex: 1, justifyContent: "space-between" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  title: { fontFamily: "Schoolbell_400Regular", fontSize: 34, color: "#1D1A17" },
  refresh: { fontSize: 11, fontWeight: "800", color: "#78845C" },
  feed: { gap: 12, paddingBottom: 20 },
  empty: { alignItems: "center", backgroundColor: "#FFFDF8", borderRadius: 26, padding: 28 },
  emptyDogs: { fontSize: 34 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#1D1A17", marginTop: 10 },
  emptyText: { fontSize: 12, color: "#756B60", marginTop: 5 },
  card: { backgroundColor: "#FFFDF8", borderRadius: 24, padding: 15 },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#F1E7D7", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 21 },
  cardHeaderCopy: { flex: 1, marginLeft: 10 },
  dogName: { fontSize: 15, fontWeight: "800", color: "#1D1A17" },
  date: { fontSize: 10, color: "#82786E", marginTop: 2 },
  walkTitle: { fontSize: 18, fontWeight: "800", color: "#332E29", marginTop: 14 },
  map: { height: 170, borderRadius: 18, overflow: "hidden", marginTop: 12 },
  metrics: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  metric: { fontSize: 12, fontWeight: "700", color: "#655D54" },
  dot: { color: "#A99F93", marginHorizontal: 7 },
  actions: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  boopButton: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: "#B9C1A5", borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 },
  boopButtonActive: { backgroundColor: "#89936B", borderColor: "#89936B" },
  boopButtonDisabled: { opacity: 0.5 },
  boopText: { fontSize: 11, fontWeight: "800", color: "#596442" },
  boopTextActive: { color: "#FFFDF8" },
  boopCount: { fontSize: 11, color: "#756B60", marginLeft: 9 },
  nav: { height: 68, borderRadius: 25, backgroundColor: "#FFFDF8", flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  navItem: { width: 58, alignItems: "center" },
  navLabel: { fontSize: 9, color: "#443D37", marginTop: 2 },
  active: { color: "#78845C", fontWeight: "800" },
  pawButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#89936B", alignItems: "center", justifyContent: "center", marginTop: -20 },
});
