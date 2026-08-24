import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { PawPrint } from "@sketchyicons/react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onStart: (shareRoute: boolean) => void;
  description?: string;
};

export function StartWalkSheet({ visible, onClose, onStart, description = "Friends can see the route after you save the walk. Your live location is never shared." }: Props) {
  const [shareRoute, setShareRoute] = useState(false);

  useEffect(() => {
    if (!visible) setShareRoute(false);
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.titleRow}><PawPrint size={27} strokeWidth={2} color="#1D1A17" /><Text style={styles.title}>Ready for a waltz?</Text></View>
          <View style={styles.shareRow}>
            <View style={styles.shareCopyWrap}><Text style={styles.shareTitle}>Share this route</Text><Text style={styles.shareCopy}>{description}</Text></View>
            <Switch value={shareRoute} onValueChange={setShareRoute} />
          </View>
          <Pressable style={styles.startButton} onPress={() => { onClose(); onStart(shareRoute); }}>
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
  shareRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  shareCopyWrap: { flex: 1 },
  shareTitle: { fontSize: 15, fontWeight: "800", color: "#1D1A17" },
  shareCopy: { fontSize: 11, lineHeight: 15, color: "#756B60", marginTop: 3 },
  startButton: { backgroundColor: "#8C9670", borderRadius: 999, paddingVertical: 15 },
  startButtonContent: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  startButtonText: { fontFamily: "Schoolbell_400Regular", fontSize: 23, color: "#FFFDF8", letterSpacing: 1 },
  cancel: { textAlign: "center", fontSize: 13, fontWeight: "700", color: "#756B60" },
});
