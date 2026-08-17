import { Pressable, StyleSheet, Text, View } from "react-native";
import { Walk } from "../types/walk";
import { calculateWalkStreak } from "../utils/streak";

type Props = {
  walks: Walk[];
  onStartWalk: () => void;
};

export function HomeScreen({ walks, onStartWalk }: Props) {
  const totalDistance = walks.reduce((sum, walk) => sum + walk.distance_km, 0);
  const streak = calculateWalkStreak(walks);

  return (
    <>
      <Text style={styles.streak}>
        🔥 {streak} day{streak === 1 ? "" : "s"} streak
      </Text>
      <Text style={styles.stats}>
        🐾 {walks.length} walks · {totalDistance.toFixed(2)} km
      </Text>

      {walks.length > 0 && (
        <View style={styles.recent}>
          <Text style={styles.recentTitle}>Recent walk</Text>
          <Text style={styles.recentWalk}>
            {walks[0].distance_km.toFixed(2)} km · {Math.round(walks[0].duration_seconds / 60)} min
          </Text>
        </View>
      )}

      <Pressable style={styles.button} onPress={onStartWalk}>
        <Text style={styles.buttonText}>START WALK</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  streak: { fontSize: 18, marginBottom: 40 },
  stats: { fontSize: 17, marginBottom: 24 },
  recent: { alignItems: "center", marginBottom: 30 },
  recentTitle: { fontSize: 14, opacity: 0.5, marginBottom: 6 },
  recentWalk: { fontSize: 18, fontWeight: "600" },
  button: {
    backgroundColor: "#111",
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 999,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
