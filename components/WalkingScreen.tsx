import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Coffee, Fish, Mountain } from "@sketchyicons/react-native";
import { Point, RoutePrivacy, WalkTag } from "../types/walk";
import { hiddenEndsWillShowMap } from "../utils/routePrivacy";
import { formatTime } from "../utils/time";
import { WaltzMap } from "./WaltzMap";

type Props = {
  seconds: number;
  distance: number;
  points: Point[];
  dogName: string;
  tags: WalkTag[];
  routePrivacy: RoutePrivacy;
  onTagsChange: (tags: WalkTag[]) => void;
  onRoutePrivacyChange: (privacy: RoutePrivacy) => void;
  onStopWalk: () => void | Promise<void>;
};

export function WalkingScreen({ seconds, distance, points, dogName, tags, routePrivacy, onTagsChange, onRoutePrivacyChange, onStopWalk }: Props) {
  const latest = points[points.length - 1];
  const toggleTag = (tag: WalkTag) => onTagsChange(tags.includes(tag) ? tags.filter((value) => value !== tag) : [...tags, tag]);
  return <View style={styles.screen}>
    <Text style={styles.walking}>{dogName} is walking...</Text>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.mapWrap}>{latest ? <WaltzMap points={points} dogName={dogName} interactive showLocation /> : <View style={styles.wait}><Text style={styles.waitText}>📍 Finding your location...</Text></View>}</View>
      <View style={styles.metrics}><View><Text style={styles.label}>TIME</Text><Text style={styles.value}>{formatTime(seconds)}</Text></View><View><Text style={styles.label}>DISTANCE</Text><Text style={styles.value}>{distance.toFixed(2)} km</Text></View></View>

      <View style={styles.card}><Text style={styles.cardTitle}>Add some tags</Text><Text style={styles.hint}>You can change these now or after the walk.</Text><View style={styles.tags}>
        <Tag selected={tags.includes("trail")} onPress={() => toggleTag("trail")} icon={<Mountain size={19} strokeWidth={2} />} label="Trail" />
        <Tag selected={tags.includes("swim")} onPress={() => toggleTag("swim")} icon={<Fish size={19} strokeWidth={2} />} label="Gone fishing" />
        <Tag selected={tags.includes("coffee")} onPress={() => toggleTag("coffee")} icon={<Coffee size={19} strokeWidth={2} />} label="Coffee stop" />
      </View></View>

      <View style={styles.card}><Text style={styles.cardTitle}>Who can see this?</Text><Text style={styles.hint}>This controls what appears in Feed after you save.</Text>
        <Privacy selected={routePrivacy === "hidden_ends"} title="Hide home area · Recommended" copy={hiddenEndsWillShowMap(points) ? "Hide about 200 m at both ends." : "Short routes will share stats without a map."} onPress={() => onRoutePrivacyChange("hidden_ends")} />
        <Privacy selected={routePrivacy === "full"} title="Share full route" copy="Show the complete route." onPress={() => onRoutePrivacyChange("full")} />
        <Privacy selected={routePrivacy === "stats_only"} title="Share stats only" copy="Show distance, time and Boops—no map." onPress={() => onRoutePrivacyChange("stats_only")} />
      </View>
    </ScrollView>
    <Pressable style={styles.button} onPress={onStopWalk}><Text style={styles.buttonText}>STOP WALK</Text></Pressable>
  </View>;
}

function Tag({ selected, onPress, icon, label }: { selected: boolean; onPress: () => void; icon: React.ReactNode; label: string }) { return <Pressable onPress={onPress} style={[styles.tag, selected && styles.tagSelected]}><View style={styles.tagIcon}>{icon}</View><Text style={[styles.tagText, selected && styles.tagTextSelected]}>{label}</Text></Pressable>; }
function Privacy({ selected, title, copy, onPress }: { selected: boolean; title: string; copy: string; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.privacy, selected && styles.privacySelected]}><View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioDot} /> : null}</View><View style={styles.privacyCopy}><Text style={styles.privacyTitle}>{title}</Text><Text style={styles.privacyHint}>{copy}</Text></View></Pressable>; }

const styles = StyleSheet.create({
  screen: { flex: 1, gap: 12 }, walking: { fontFamily: "Schoolbell_400Regular", fontSize: 28, color: "#25211D" }, content: { gap: 10, paddingBottom: 8 },
  mapWrap: { height: 190, borderRadius: 22, overflow: "hidden", backgroundColor: "#EFE8DC" }, wait: { flex: 1, alignItems: "center", justifyContent: "center" }, waitText: { color: "#756B60" },
  metrics: { flexDirection: "row", justifyContent: "flex-start", gap: 42, backgroundColor: "#FFFDF8", padding: 14, borderRadius: 18 }, label: { fontSize: 9, color: "#756B60", fontWeight: "800" }, value: { fontSize: 24, fontWeight: "800", color: "#1D1A17", marginTop: 2 },
  card: { backgroundColor: "#FFFDF8", borderRadius: 18, padding: 13, gap: 7 }, cardTitle: { fontSize: 14, fontWeight: "800", color: "#1D1A17" }, hint: { fontSize: 10, lineHeight: 14, color: "#756B60" }, tags: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  tag: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 7, paddingHorizontal: 9, borderRadius: 999, backgroundColor: "#F1E7D7", borderWidth: 1, borderColor: "transparent" }, tagSelected: { backgroundColor: "#E6EAD9", borderColor: "#8C9670" }, tagIcon: { width: 20, alignItems: "center" }, tagText: { fontSize: 11, fontWeight: "700", color: "#655D54" }, tagTextSelected: { color: "#596442" },
  privacy: { flexDirection: "row", alignItems: "center", gap: 9, borderWidth: 1, borderColor: "#E5E0D8", borderRadius: 11, padding: 9 }, privacySelected: { borderColor: "#8C9670", backgroundColor: "#F6F7F0" }, radio: { width: 17, height: 17, borderRadius: 9, borderWidth: 1.5, borderColor: "#AAA197", alignItems: "center", justifyContent: "center" }, radioSelected: { borderColor: "#78845C" }, radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#78845C" }, privacyCopy: { flex: 1 }, privacyTitle: { fontSize: 11, fontWeight: "800", color: "#332E29" }, privacyHint: { fontSize: 9, lineHeight: 12, color: "#756B60", marginTop: 1 },
  button: { backgroundColor: "#1D1A17", paddingVertical: 16, borderRadius: 999, alignItems: "center" }, buttonText: { color: "#FFFDF8", fontSize: 17, fontWeight: "800" },
});
