import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CalendarDays, Footprints, Medal, Trophy } from "@sketchyicons/react-native";
import { BottomNav } from "./BottomNav";
import type { AppTab } from "./HubScreen";

type Props = {
  onNavigate: (tab: AppTab) => void;
  onStartWalk: () => void;
};

function monthLabel() {
  return new Date().toLocaleDateString("en-AU", { month: "long" });
}

export function ClubScreen({ onNavigate, onStartWalk }: Props) {
  const month = monthLabel();

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Club</Text>
        <Text style={styles.subtitle}>Play now. Keep the memories.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ClubRow
          icon={<CalendarDays size={24} strokeWidth={2} color="#78845C" />}
          eyebrow={month.toUpperCase()}
          title={month + " Report"}
          copy="Your walks, distance, time and little stories from this month."
          onPress={() => onNavigate("report")}
        />
        <ClubRow
          icon={<Trophy size={24} strokeWidth={2} color="#78845C" />}
          eyebrow={month.toUpperCase()}
          title="Ranking"
          copy="See where your dog sits in this month's pack."
          onPress={() => onNavigate("leaderboard")}
        />
        <ClubRow
          icon={<Medal size={24} strokeWidth={2} color="#78845C" />}
          eyebrow={month.toUpperCase()}
          title="Achievements"
          copy="Monthly goals, stamps and things worth bragging about."
          onPress={() => onNavigate("achievements")}
        />
        <ClubRow
          icon={<Footprints size={24} strokeWidth={2} color="#78845C" />}
          eyebrow="LIFETIME"
          title="Places"
          copy="Everywhere you've wandered together, kept for good."
          onPress={() => onNavigate("places")}
        />
      </ScrollView>

      <BottomNav active="club" onNavigate={onNavigate} onStartPress={onStartWalk} />
    </View>
  );
}

function ClubRow({
  icon,
  eyebrow,
  title,
  copy,
  onPress,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  copy: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress} accessibilityRole="button">
      <View style={styles.icon}>{icon}</View>
      <View style={styles.rowCopy}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.copy}>{copy}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "space-between" },
  header: { marginBottom: 14 },
  title: { fontFamily: "Schoolbell_400Regular", fontSize: 34, color: "#1D1A17" },
  subtitle: { fontSize: 11, color: "#8B8278", marginTop: -2 },
  content: { paddingBottom: 20, gap: 10 },
  row: {
    minHeight: 104,
    borderRadius: 22,
    backgroundColor: "#FFFDF8",
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#F2EEE4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },
  rowCopy: { flex: 1 },
  eyebrow: { fontSize: 8, fontWeight: "900", letterSpacing: 1.4, color: "#9A9187", marginBottom: 3 },
  rowTitle: { fontFamily: "Schoolbell_400Regular", fontSize: 24, lineHeight: 27, color: "#332E29" },
  copy: { fontSize: 10, lineHeight: 14, color: "#82786E", marginTop: 2, maxWidth: 240 },
  chevron: { fontSize: 28, color: "#AAA196", marginLeft: 8, marginTop: -2 },
});
