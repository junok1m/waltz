import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Balloon, Bird, ChartBar, Coffee, Dog as DogIcon, Fish, Flag, Flame, Footprints, House, MoonStar, Mountain, PawPrint, Route, Rss, Ruler, Timer, Umbrella } from "@sketchyicons/react-native";
import { Dog } from "../types/dog";
import { Walk, WalkTag } from "../types/walk";
import { calculateWalkStreak } from "../utils/streak";

export type AppTab = "home" | "map" | "community" | "me" | "leaderboard" | "stats" | "challenges";
type HubTab = Extract<AppTab, "leaderboard" | "stats" | "challenges">;
type Props = { tab: HubTab; walks: Walk[]; dog: Dog; onNavigate: (tab: AppTab) => void; onStartWalk: (shareRoute: boolean) => void };
type ChallengeInfo = { id: string; title: string; progress: string; description: string; done: boolean; icon: React.ReactNode; color: string };

function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function HubScreen({ tab, walks, dog, onNavigate, onStartWalk }: Props) {
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeInfo | null>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [shareRoute, setShareRoute] = useState(false);
  const totalDistance = walks.reduce((sum, walk) => sum + walk.distance_km, 0);
  const totalSeconds = walks.reduce((sum, walk) => sum + walk.duration_seconds, 0);
  const streak = calculateWalkStreak(walks);
  const longest = walks.reduce((best, walk) => Math.max(best, walk.distance_km), 0);
  const earlyBirdWalks = walks.filter((walk) => new Date(walk.ended_at).getHours() < 8).length;
  const nightShiftWalks = walks.filter((walk) => new Date(walk.ended_at).getHours() >= 20).length;
  const taggedWalks = (tag: WalkTag) => walks.filter((walk) => walk.tags?.includes(tag)).length;
  const title = { leaderboard: "Leaderboard", stats: "Stats", challenges: "Challenges" }[tab];

  const badgeChallenges: ChallengeInfo[] = [
    { id: "keep-flame", title: "Keep the flame", progress: `${Math.min(streak, 7)}/7`, description: "Complete a walk on 7 consecutive days.", done: streak >= 7, icon: <Flame size={31} strokeWidth={2} color="#E87859" />, color: "#F7DDD4" },
    { id: "tiny-adventures", title: "Tiny adventures", progress: `${Math.min(walks.length, 10)}/10`, description: "Complete 10 walks.", done: walks.length >= 10, icon: <Balloon size={31} strokeWidth={2} color="#6F7D54" />, color: "#E5EBDD" },
    { id: "trail", title: "Trail", progress: `${Math.min(taggedWalks("trail"), 5)}/5`, description: "Complete 5 walks tagged as Trail.", done: taggedWalks("trail") >= 5, icon: <Mountain size={31} strokeWidth={2} color="#796B54" />, color: "#EEE0C8" },
    { id: "gone-fishing", title: "Gone fishing", progress: `${Math.min(taggedWalks("swim"), 5)}/5`, description: "Have a swim or splash on 5 walks and tag them Gone fishing.", done: taggedWalks("swim") >= 5, icon: <Fish size={31} strokeWidth={2} color="#557784" />, color: "#DDEAF0" },
    { id: "coffee-stop", title: "Coffee stop", progress: `${Math.min(taggedWalks("coffee"), 10)}/10`, description: "Make a coffee stop on 10 walks.", done: taggedWalks("coffee") >= 10, icon: <Coffee size={31} strokeWidth={2} color="#806451" />, color: "#EADDD2" },
    { id: "early-bird", title: "Early bird", progress: `${Math.min(earlyBirdWalks, 3)}/3`, description: "Complete 3 walks before 8am.", done: earlyBirdWalks >= 3, icon: <Bird size={31} strokeWidth={2} color="#7A6F51" />, color: "#F6EBC4" },
    { id: "night-shift", title: "Night shift", progress: `${Math.min(nightShiftWalks, 3)}/3`, description: "Complete 3 walks after 8pm.", done: nightShiftWalks >= 3, icon: <MoonStar size={31} strokeWidth={2} color="#666584" />, color: "#E3E0F1" },
    { id: "rainy-day", title: "Rainy day", progress: "0/1", description: "Complete a walk while it is raining. Automatic weather detection is coming soon.", done: false, icon: <Umbrella size={31} strokeWidth={2} color="#5D7680" />, color: "#DDE8EA" },
  ];
  const mileageChallenges: ChallengeInfo[] = [10, 100, 500, 1000].map((km, index) => ({
    id: `mileage-${km}`,
    title: `First ${km.toLocaleString()} km`,
    progress: `${Math.min(totalDistance, km).toFixed(1)}/${km.toLocaleString()} km`,
    description: `Walk a total of ${km.toLocaleString()} km with ${dog.name}.`,
    done: totalDistance >= km,
    icon: <Flag size={30} strokeWidth={2} color="#687455" />,
    color: ["#E5EBDD", "#F6EBC4", "#F1DCD3", "#DDE8EA"][index],
  }));

  return (
    <View style={styles.screen}>
      <View style={styles.header}><Text style={styles.title}>{title}</Text></View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === "stats" ? (
          <View style={styles.grid}>
            <Stat label="Walks" value={`${walks.length}`} icon={<Footprints size={29} strokeWidth={2} color="#78845C" />} />
            <Stat label="Distance" value={`${totalDistance.toFixed(1)} km`} icon={<Ruler size={29} strokeWidth={2} color="#78845C" />} />
            <Stat label="Time" value={formatDuration(totalSeconds)} icon={<Timer size={29} strokeWidth={2} color="#78845C" />} />
            <Stat label="Longest" value={`${longest.toFixed(1)} km`} icon={<Route size={29} strokeWidth={2} color="#78845C" />} />
          </View>
        ) : null}
        {tab === "leaderboard" ? (
          <>
            <Text style={styles.kicker}>FRIENDS LEAGUE · PREVIEW</Text>
            <View style={styles.podium}>
              <Text style={styles.podiumEmoji}>🏆</Text>
              <Text style={styles.big}>{dog.name}</Text>
              <Text style={styles.muted}>{totalDistance.toFixed(1)} km total</Text>
            </View>
            <Empty text="Friend rankings land here once community profiles are connected." />
          </>
        ) : null}
        {tab === "challenges" ? (
          <>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Badges</Text><Text style={styles.sectionCopy}>Tap a badge to see how to earn it.</Text></View>
            <View style={styles.badgeGrid}>{badgeChallenges.map((challenge) => <Badge key={challenge.id} challenge={challenge} onPress={() => setSelectedChallenge(challenge)} />)}</View>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Mileage</Text><Text style={styles.sectionCopy}>Tiny paws, suspiciously large numbers.</Text></View>
            <View style={styles.mileageGrid}>{mileageChallenges.map((challenge) => <MileageBadge key={challenge.id} challenge={challenge} onPress={() => setSelectedChallenge(challenge)} />)}</View>
          </>
        ) : null}
      </ScrollView>
      <View style={styles.nav}>
        <Nav icon={<House size={22} strokeWidth={2} color="#332E29" />} label="Home" onPress={() => onNavigate("home")} />
        <Nav icon={<ChartBar size={22} strokeWidth={2} color="#332E29" />} label="Report" onPress={() => onNavigate("map")} />
        <Pressable style={styles.pawButton} onPress={() => setStartOpen(true)}><PawPrint size={27} strokeWidth={2} color="#FFFDF8" /></Pressable>
        <Nav icon={<Rss size={22} strokeWidth={2} color="#332E29" />} label="Feed" onPress={() => onNavigate("community")} />
        <Nav icon={<DogIcon size={22} strokeWidth={2} color="#332E29" />} label="Me" onPress={() => onNavigate("me")} />
      </View>
      <Modal visible={!!selectedChallenge} transparent animationType="fade" onRequestClose={() => setSelectedChallenge(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedChallenge(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            {selectedChallenge ? <>
              <View style={[styles.modalBadge, selectedChallenge.done && { backgroundColor: selectedChallenge.color }]}>{selectedChallenge.icon}</View>
              <Text style={styles.modalTitle}>{selectedChallenge.title}</Text>
              <Text style={styles.modalProgress}>{selectedChallenge.progress}</Text>
              <Text style={styles.modalDescription}>{selectedChallenge.description}</Text>
              {selectedChallenge.done ? <Text style={styles.earned}>Badge earned ✓</Text> : null}
              <Pressable style={styles.closeButton} onPress={() => setSelectedChallenge(null)}><Text style={styles.closeText}>Got it</Text></Pressable>
            </> : null}
          </Pressable>
        </Pressable>
      </Modal>
      <Modal visible={startOpen} transparent animationType="fade" onRequestClose={() => setStartOpen(false)}>
        <View style={styles.startOverlay}>
          <View style={styles.startSheet}>
            <View style={styles.startTitleRow}><PawPrint size={27} strokeWidth={2} color="#1D1A17" /><Text style={styles.startTitle}>Ready for a waltz?</Text></View>
            <View style={styles.shareRow}>
              <View style={{ flex: 1 }}><Text style={styles.shareTitle}>Share this route</Text><Text style={styles.shareCopy}>Friends can see the route after you save the walk. Your live location is never shared.</Text></View>
              <Switch value={shareRoute} onValueChange={setShareRoute} />
            </View>
            <Pressable style={styles.startButton} onPress={() => { setStartOpen(false); onStartWalk(shareRoute); }}><View style={styles.startButtonContent}><PawPrint size={27} strokeWidth={2} color="#FFFDF8" /><Text style={styles.startButtonText}>START WALK</Text></View></Pressable>
            <Pressable onPress={() => setStartOpen(false)}><Text style={styles.cancel}>Cancel</Text></Pressable>
          </View>
        </View>
      </Modal>
    </View>
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
function Empty({ text }: { text: string }) {
  return <View style={styles.empty}><Text style={styles.emptyText}>{text}</Text></View>;
}
function Nav({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return <Pressable style={styles.navItem} onPress={onPress}>{icon}<Text style={styles.navLabel}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "space-between" },
  header: { alignItems: "center", marginBottom: 18 },
  title: { fontFamily: "Schoolbell_400Regular", fontSize: 34, color: "#1D1A17" },
  content: { paddingBottom: 24, gap: 12 },
  kicker: { fontSize: 12, fontWeight: "800", letterSpacing: 1.5, color: "#8C9670", marginBottom: 2 },
  big: { fontSize: 25, fontWeight: "800", color: "#1D1A17", marginTop: 8 },
  muted: { color: "#756B60", marginTop: 4 },
  empty: { padding: 22, borderRadius: 22, backgroundColor: "#F1E7D7" },
  emptyText: { color: "#655D54", lineHeight: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stat: { width: "48%", minHeight: 140, backgroundColor: "#FFFDF8", borderRadius: 24, padding: 18, justifyContent: "center" },
  statIcon: { height: 32, justifyContent: "center", marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: "800", color: "#1D1A17", marginTop: 5 },
  podium: { alignItems: "center", backgroundColor: "#FFFDF8", borderRadius: 28, padding: 28 },
  podiumEmoji: { fontSize: 46 },
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
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,.3)", alignItems: "center", justifyContent: "center", padding: 28 },
  modalCard: { width: "100%", maxWidth: 360, backgroundColor: "#FFFDF8", borderRadius: 30, padding: 26, alignItems: "center" },
  modalBadge: { width: 92, height: 92, borderRadius: 46, borderWidth: 2, borderColor: "#CFC5B7", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  modalTitle: { fontFamily: "Schoolbell_400Regular", fontSize: 30, color: "#1D1A17" },
  modalProgress: { fontSize: 13, fontWeight: "800", color: "#78845C", marginTop: 3 },
  modalDescription: { fontSize: 14, lineHeight: 20, color: "#655D54", textAlign: "center", marginTop: 14 },
  earned: { fontSize: 12, fontWeight: "800", color: "#596442", marginTop: 12 },
  closeButton: { backgroundColor: "#8C9670", paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999, marginTop: 20 },
  closeText: { color: "#FFFDF8", fontWeight: "800" },
  nav: { height: 68, borderRadius: 25, backgroundColor: "#FFFDF8", flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  navItem: { width: 58, alignItems: "center" },
  navLabel: { fontSize: 9, color: "#443D37", marginTop: 2 },
  pawButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#89936B", alignItems: "center", justifyContent: "center", marginTop: -20 },
  startOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,.28)", justifyContent: "flex-end" },
  startSheet: { backgroundColor: "#FFFDF8", borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 34, gap: 18 },
  startTitleRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  startTitle: { fontFamily: "Schoolbell_400Regular", fontSize: 29, color: "#1D1A17" },
  shareRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#F8F3E9", borderRadius: 20, padding: 14 },
  shareTitle: { fontSize: 15, fontWeight: "800", color: "#1D1A17" },
  shareCopy: { fontSize: 11, lineHeight: 15, color: "#756B60", marginTop: 3 },
  startButton: { backgroundColor: "#8C9670", borderRadius: 999, paddingVertical: 15 },
  startButtonContent: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  startButtonText: { fontFamily: "Schoolbell_400Regular", fontSize: 23, color: "#FFFDF8", letterSpacing: 1 },
  cancel: { textAlign: "center", fontSize: 13, color: "#756B60", textDecorationLine: "underline" },
});
