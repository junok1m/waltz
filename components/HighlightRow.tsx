import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  icon: ReactNode;
  label: string;
  text: string | string[];
  onPress?: () => void;
};

export function HighlightRow({ icon, label, text, onPress }: Props) {
  return (
    <Pressable style={s.row} onPress={onPress}>
      <View style={s.icon}>{icon}</View>
      <View style={s.copy}>
        <Text style={s.label}>{label}</Text>
        {(Array.isArray(text) ? text : [text]).map((line, index) => (
          <Text key={`${line}-${index}`} style={s.text}>
            {line}
          </Text>
        ))}
      </View>
      {onPress ? <Text style={s.arrow}>›</Text> : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E6DED1",
  },
  icon: {
    width: 22,
    alignItems: "center",
  },
  copy: {
    flex: 1,
  },
  label: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "#78845C",
  },
  text: {
    fontSize: 12,
    color: "#655D54",
    marginTop: 2,
  },
  arrow: {
    fontSize: 18,
    color: "#756B60",
  },
});
