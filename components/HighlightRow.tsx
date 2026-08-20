import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  icon: string;
  text: string;
  onPress?: () => void;
};

export function HighlightRow({ icon, text, onPress }: Props) {
  return (
    <Pressable style={s.row} onPress={onPress}>
      <Text style={s.icon}>{icon}</Text>
      <Text style={s.text}>{text}</Text>
      {onPress ? <Text style={s.arrow}>›</Text> : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 7,
  },
  icon: {
    fontSize: 16,
    width: 22,
  },
  text: {
    flex: 1,
    fontSize: 12,
    color: "#655D54",
  },
  arrow: {
    fontSize: 18,
    color: "#756B60",
  },
});
