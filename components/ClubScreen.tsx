import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CalendarDays, MapPinned, Medal, Trophy } from "@sketchyicons/react-native";
import { BottomNav } from "./BottomNav";
import type { AppTab } from "./HubScreen";

type Props = {
  onNavigate: (tab: AppTab) => void;
  onStartWalk: () => void;
};


export function ClubScreen({ onNavigate, onStartWalk }: Props) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Club</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ClubRow
          number="01"
          icon={<CalendarDays size={37} strokeWidth={1.8} color="#78845C" />}
          title="Report"
          copy="Walks, distance and time"
          onPress={() => onNavigate("report")}
        />
        <ClubRow
          number="02"
          icon={<Trophy size={37} strokeWidth={1.8} color="#78845C" />}
          title="Ranking"
          copy="This month’s pack"
          onPress={() => onNavigate("leaderboard")}
        />
        <ClubRow
          number="03"
          icon={<Medal size={37} strokeWidth={1.8} color="#78845C" />}
          title="Achievements"
          copy="Goals and milestones"
          onPress={() => onNavigate("achievements")}
        />
        <ClubRow
          number="04"
          icon={<MapPinned size={37} strokeWidth={1.8} color="#78845C" />}
          title="Places"
          copy="Everywhere you wandered"
          onPress={() => onNavigate("places")}
        />
      </ScrollView>

      <BottomNav active="club" onNavigate={onNavigate} onStartPress={onStartWalk} />
    </View>
  );
}

function ClubRow({
  number,
  icon,
  title,
  copy,
  onPress,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  copy: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open ${title}`}>
      <Text style={styles.number}>{number}</Text>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.copy}>{copy}</Text>
      </View>
      <View style={styles.icon}>{icon}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "space-between" },
  header: { marginBottom: 10 },
  title: { fontFamily: "Schoolbell_400Regular", fontSize: 34, color: "#1D1A17" },
  content: { paddingBottom: 20, paddingHorizontal: 4 },
  row: {
    minHeight: 94,
    paddingVertical: 17,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#CEC6B9",
  },
  rowPressed: { opacity: 0.55 },
  number: { width: 34, alignSelf: "flex-start", paddingTop: 5, fontSize: 9, fontWeight: "800", letterSpacing: 1, color: "#9B9288" },
  icon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 14,
  },
  rowCopy: { flex: 1 },
  rowTitle: { fontSize: 18, lineHeight: 23, fontWeight: "700", color: "#332E29" },
  copy: { fontSize: 10, lineHeight: 14, color: "#82786E", marginTop: 3 },
});
