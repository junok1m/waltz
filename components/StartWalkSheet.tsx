import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { PawPrint } from "@sketchyicons/react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onStart: (shareRoute: boolean) => void;
};

export function StartWalkSheet({ visible, onClose, onStart }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.titleRow}><PawPrint size={27} strokeWidth={2} color="#1D1A17" /><Text style={styles.title}>Ready for a waltz?</Text></View>
          <Text style={styles.copy}>Choose who can see it after the walk. Your live location is never shared.</Text>
          <Pressable style={styles.startButton} onPress={() => { onClose(); onStart(false); }}>
            <View style={styles.startButtonContent}><PawPrint size={27} strokeWidth={2} color="#FFFDF8" /><Text style={styles.startButtonText}>START WALK</Text></View>
          </Pressable>
          <Pressable onPress={onClose}><Text style={styles.cancel}>Cancel</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,.28)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#FFFDF8", borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 38, gap: 18 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  title: { fontFamily: "Schoolbell_400Regular", fontSize: 29, color: "#1D1A17" },
  copy: { fontSize: 12, lineHeight: 17, color: "#756B60" },
  startButton: { backgroundColor: "#8C9670", borderRadius: 999, paddingVertical: 15 },
  startButtonContent: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  startButtonText: { fontFamily: "Schoolbell_400Regular", fontSize: 23, color: "#FFFDF8", letterSpacing: 1 },
  cancel: { textAlign: "center", fontSize: 13, fontWeight: "700", color: "#756B60" },
});
