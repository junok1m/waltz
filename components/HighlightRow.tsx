import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  icon: React.ReactNode;
  title: string;
  onPress?: () => void;
};

export function HighlightRow({ icon, title, onPress }: Props) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.icon}>{icon}</View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  icon: {
    width: 32,
    alignItems: "center",
  },
  title: {
    flex: 1,
    fontSize: 15,
    color: "#1D1A17",
    fontWeight: "600",
  },
  arrow: {
    fontSize: 22,
    color: "#756B60",
  },
});
