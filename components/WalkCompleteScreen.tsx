import { Pressable, StyleSheet, Text } from "react-native";
import { formatTime } from "../utils/time";

type Props = {
  seconds: number;
  distance: number;
  onSave: () => void;
  onDiscard: () => void;
};

export function WalkCompleteScreen({ seconds, distance, onSave, onDiscard }: Props) {
  return (
    <>
      <Text style={styles.complete}>Walk complete! 🎉</Text>
      <Text style={styles.resultDistance}>{distance.toFixed(2)} km</Text>
      <Text style={styles.resultTime}>{formatTime(seconds)}</Text>
      <Text style={styles.message}>Janggo did a waltz 🐕</Text>

      <Pressable style={styles.button} onPress={onSave}>
        <Text style={styles.buttonText}>SAVE WALK</Text>
      </Pressable>
      <Pressable onPress={onDiscard}>
        <Text style={styles.discard}>Discard</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  complete: { fontSize: 24, fontWeight: "600", marginBottom: 20 },
  resultDistance: { fontSize: 52, fontWeight: "700" },
  resultTime: { fontSize: 24, marginTop: 4, marginBottom: 24 },
  message: { fontSize: 18, marginBottom: 36 },
  button: {
    backgroundColor: "#111",
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 999,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  discard: { fontSize: 16, marginTop: 20, textDecorationLine: "underline" },
});
