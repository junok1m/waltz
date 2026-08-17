import { Pressable, StyleSheet, Text } from "react-native";
import { formatTime } from "../utils/time";

type Props = {
  seconds: number;
  distance: number;
  onStopWalk: () => void;
};

export function WalkingScreen({ seconds, distance, onStopWalk }: Props) {
  return (
    <>
      <Text style={styles.walking}>Janggo is walking...</Text>
      <Text style={styles.timer}>{formatTime(seconds)}</Text>
      <Text style={styles.distance}>{distance.toFixed(2)} km</Text>
      <Text style={styles.gps}>📍 GPS tracking</Text>
      <Pressable style={styles.button} onPress={onStopWalk}>
        <Text style={styles.buttonText}>STOP WALK</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  walking: { fontSize: 20, marginBottom: 20 },
  timer: { fontSize: 46, fontWeight: "700", marginBottom: 8 },
  distance: { fontSize: 30, fontWeight: "600", marginBottom: 8 },
  gps: { fontSize: 16, marginBottom: 36 },
  button: {
    backgroundColor: "#111",
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 999,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
