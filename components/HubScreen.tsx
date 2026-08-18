import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Dog } from "../types/dog";
import { Walk } from "../types/walk";
import { calculateWalkStreak } from "../utils/streak";

export type AppTab = "home" | "map" | "community" | "me" | "leaderboard" | "stats" | "challenges";

type Props = {
  tab: Exclude<AppTab, "home">;
  walks: Walk[];
  dog: Dog;
  onBack: () => void;
  onStartWalk: () => void;
  onSignOut: () => void;
};

function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function HubScreen({ tab, walks, dog, onBack, onStartWalk, onSignOut }: Props) {
  const totalDistance = walks.reduce((sum, walk) => sum + walk.distance_km, 0);
  const totalSeconds = walks.reduce((sum, walk) => sum + walk.duration_seconds, 0);
  const streak = calculateWalkStreak(walks);
  const longest = walks.reduce((best, walk) => Math.max(best, walk.distance_km), 0);

  const title = {
    map: "Walk history",
    community: "Community",
    me: dog.name,
    leaderboard: "Leaderboard",
    stats: "Stats",
    challenges: "Challenges",
  }[tab];

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12}><Text style={styles.back}>‹</Text></Pressable>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === "map" && (
          <>
            <Text style={styles.kicker}>YOUR PAWPRINTS</Text>
            {walks.length === 0 ? <Empty text="Your walks will appear here after your first save." /> : walks.map((walk) => (
              <View key={walk.id} style={styles.card}>
                <View style={styles.row}><Text style={styles.cardTitle}>🐾 {walk.dog_name}</Text><Text style={styles.date}>{new Date(walk.ended_at).toLocaleDateString("en-AU")}</Text></View>
                <Text style={styles.big}>{walk.distance_km.toFixed(2)} km</Text>
                <Text style={styles.muted}>{formatDuration(walk.duration_seconds)}</Text>
              </View>
            ))}
          </>
        )}

        {tab === "stats" && (
          <View style={styles.grid}>
            <Stat label="Walks" value={`${walks.length}`} icon="🐾" />
            <Stat label="Distance" value={`${totalDistance.toFixed(1)} km`} icon="⛰️" />
            <Stat label="Time" value={formatDuration(totalSeconds)} icon="⏱️" />
            <Stat label="Longest" value={`${longest.toFixed(1)} km`} icon="🌭" />
          </View>
        )}

        {tab === "leaderboard" && (
          <>
            <Text style={styles.kicker}>FRIENDS LEAGUE · PREVIEW</Text>
            <View style={styles.podium}><Text style={styles.podiumEmoji}>🏆</Text><Text style={styles.big}>{dog.name}</Text><Text style={styles.muted}>{totalDistance.toFixed(1)} km total</Text></View>
            <Empty text="Friend rankings land here once community profiles are connected." />
          </>
        )}

        {tab === "challenges" && (
          <>
            <Challenge icon="🔥" title="Keep the flame" progress={`${Math.min(streak, 7)}/7 days`} done={streak >= 7} />
            <Challenge icon="🐾" title="Ten tiny adventures" progress={`${Math.min(walks.length, 10)}/10 walks`} done={walks.length >= 10} />
            <Challenge icon="🌍" title="Around the block-ish" progress={`${Math.min(totalDistance, 25).toFixed(1)}/25 km`} done={totalDistance >= 25} />
          </>
        )}

        {tab === "community" && (
          <>
            <View style={styles.podium}><Text style={styles.podiumEmoji}>🐕🐩🦮</Text><Text style={styles.big}>The park is quiet... for now</Text></View>
            <Empty text="Friends, shared walks and neighbourhood posts will live here. The shell is ready for the social backend." />
          </>
        )}

        {tab === "me" && (
          <>
            <View style={styles.profile}><Text style={styles.avatar}>🐕</Text><Text style={styles.big}>{dog.name}</Text><Text style={styles.muted}>{dog.breed || "Very good dog"}</Text></View>
            <View style={styles.card}><Text style={styles.cardTitle}>🔥 {streak} day streak</Text><Text style={styles.muted}>{walks.length} walks · {totalDistance.toFixed(1)} km together</Text></View>
            <Pressable style={styles.secondaryButton} onPress={onSignOut}><Text style={styles.secondaryText}>Sign out</Text></Pressable>
          </>
        )}
      </ScrollView>

      <Pressable style={styles.walkButton} onPress={onStartWalk}><Text style={styles.walkButtonText}>🐾 START WALK</Text></Pressable>
    </View>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return <View style={styles.stat}><Text style={styles.statIcon}>{icon}</Text><Text style={styles.muted}>{label}</Text><Text style={styles.statValue}>{value}</Text></View>;
}
function Empty({ text }: { text: string }) { return <View style={styles.empty}><Text style={styles.emptyText}>{text}</Text></View>; }
function Challenge({ icon, title, progress, done }: { icon: string; title: string; progress: string; done: boolean }) {
  return <View style={styles.card}><View style={styles.row}><Text style={styles.cardTitle}>{icon} {title}</Text><Text>{done ? "✅" : "○"}</Text></View><Text style={styles.muted}>{progress}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { flexDirection: "row", alignItems: "center", marginBottom: 18 }, back: { fontSize: 42, lineHeight: 42, color: "#2B251F" }, title: { flex: 1, textAlign: "center", fontFamily: "Schoolbell_400Regular", fontSize: 34, color: "#1D1A17" }, headerSpacer: { width: 24 }, content: { paddingBottom: 110, gap: 12 }, kicker: { fontSize: 12, fontWeight: "800", letterSpacing: 1.5, color: "#8C9670", marginBottom: 2 }, card: { backgroundColor: "#FFFDF8", borderRadius: 22, padding: 18 }, row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, cardTitle: { fontSize: 17, fontWeight: "700", color: "#1D1A17" }, date: { fontSize: 12, color: "#756B60" }, big: { fontSize: 25, fontWeight: "800", color: "#1D1A17", marginTop: 8 }, muted: { color: "#756B60", marginTop: 4 }, empty: { padding: 22, borderRadius: 22, backgroundColor: "#F1E7D7" }, emptyText: { color: "#655D54", lineHeight: 20 }, grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, stat: { width: "48%", minHeight: 140, backgroundColor: "#FFFDF8", borderRadius: 24, padding: 18, justifyContent: "center" }, statIcon: { fontSize: 28, marginBottom: 8 }, statValue: { fontSize: 22, fontWeight: "800", color: "#1D1A17", marginTop: 5 }, podium: { alignItems: "center", backgroundColor: "#FFFDF8", borderRadius: 28, padding: 28 }, podiumEmoji: { fontSize: 46 }, profile: { alignItems: "center", paddingVertical: 20 }, avatar: { fontSize: 64 }, secondaryButton: { padding: 16, alignItems: "center" }, secondaryText: { color: "#B85F4A", fontWeight: "700" }, walkButton: { position: "absolute", left: 0, right: 0, bottom: 8, backgroundColor: "#8C9670", borderRadius: 22, paddingVertical: 15, alignItems: "center" }, walkButtonText: { fontFamily: "Schoolbell_400Regular", color: "#FFFDF8", fontSize: 24, letterSpacing: 1.2 },
});
