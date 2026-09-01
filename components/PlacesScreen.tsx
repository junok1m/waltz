import { StyleSheet, Text, View } from "react-native";
import { Footprints } from "@sketchyicons/react-native";
import { BottomNav } from "./BottomNav";
import type { AppTab } from "./HubScreen";

type Props = {
  onNavigate: (tab: AppTab) => void;
  onStartWalk: () => void;
};

export function PlacesScreen({ onNavigate, onStartWalk }: Props) {
  return (
    <View style={styles.screen}>
      <View>
        <Text style={styles.title}>Places</Text>
        <Text style={styles.kicker}>LIFETIME COLLECTION</Text>

        <View style={styles.emptyCard}>
          <View style={styles.icon}>
            <Footprints size={30} strokeWidth={2} color="#78845C" />
          </View>
          <Text style={styles.emptyTitle}>Your map starts with the next waltz.</Text>
          <Text style={styles.emptyCopy}>
            Once walk locations are saved, every suburb, park and favourite wandering spot can live here.
          </Text>
        </View>
      </View>

      <BottomNav active="club" onNavigate={onNavigate} onStartPress={onStartWalk} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "space-between" },
  title: { fontFamily: "Schoolbell_400Regular", fontSize: 34, color: "#1D1A17" },
  kicker: { fontSize: 8, fontWeight: "900", letterSpacing: 1.5, color: "#9A9187", marginTop: 2 },
  emptyCard: {
    marginTop: 22,
    backgroundColor: "#FFFDF8",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 34,
    alignItems: "center",
  },
  icon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#F2EEE4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: { fontFamily: "Schoolbell_400Regular", fontSize: 25, color: "#332E29", textAlign: "center" },
  emptyCopy: { fontSize: 12, lineHeight: 18, color: "#82786E", textAlign: "center", marginTop: 8, maxWidth: 280 },
});
