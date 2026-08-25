import { StyleSheet, View } from "react-native";
import { Coffee, Fish, Mountain } from "@sketchyicons/react-native";
import { WalkTag } from "../types/walk";

const META: Record<WalkTag, { label: string; icon: React.ReactNode }> = {
  trail: { label: "Trail", icon: <Mountain size={16} strokeWidth={2} color="#78845C" /> },
  swim: { label: "Gone fishing", icon: <Fish size={16} strokeWidth={2} color="#78845C" /> },
  coffee: { label: "Coffee stop", icon: <Coffee size={16} strokeWidth={2} color="#78845C" /> },
};

export function WalkTagIcons({ tags }: { tags?: WalkTag[] | null }) {
  if (!tags?.length) return null;
  return <View style={styles.row}>{tags.map((tag) => <View key={tag} style={styles.icon} accessible accessibilityLabel={META[tag].label}>{META[tag].icon}</View>)}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  icon: { width: 27, height: 27, borderRadius: 14, backgroundColor: "#F1E7D7", alignItems: "center", justifyContent: "center" },
});
