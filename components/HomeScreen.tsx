import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Walk } from "../types/walk";
import { calculateWalkStreak } from "../utils/streak";

type Props = {
  walks: Walk[];
  onStartWalk: () => void;
};

const monthFormatter = new Intl.DateTimeFormat("en-AU", {
  month: "long",
  year: "numeric",
});

function getMonthWalks(walks: Walk[], now: Date) {
  return walks.filter((walk) => {
    const date = new Date(walk.ended_at);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  });
}

function buildMonthCalendar(now: Date, activeDates: Set<number>) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [];

  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);

  return cells.map((day) => ({ day, active: day !== null && activeDates.has(day) }));
}

export function HomeScreen({ walks, onStartWalk }: Props) {
  const now = new Date();
  const streak = calculateWalkStreak(walks);
  const monthWalks = getMonthWalks(walks, now);
  const monthDistance = monthWalks.reduce((sum, walk) => sum + walk.distance_km, 0);
  const activeDates = new Set(monthWalks.map((walk) => new Date(walk.ended_at).getDate()));
  const calendar = buildMonthCalendar(now, activeDates);
  const todayWalks = walks.filter((walk) => {
    const date = new Date(walk.ended_at);
    return date.toDateString() === now.toDateString();
  });

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.logo}>waltz</Text>
          <Text style={styles.streak}>🔥 {streak} day{streak === 1 ? "" : "s"} streak</Text>
        </View>
        <View style={styles.profileBubble}>
          <Text style={styles.profileDog}>🐕</Text>
        </View>
      </View>

      <View style={styles.calendarCard}>
        <Text style={styles.monthTitle}>{monthFormatter.format(now)}</Text>
        <View style={styles.weekRow}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day) => (
            <Text key={day} style={styles.weekLabel}>{day}</Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {calendar.map((cell, index) => (
            <View key={`${cell.day ?? 'blank'}-${index}`} style={styles.dayCell}>
              {cell.day !== null && (
                <>
                  <Text style={styles.dayNumber}>{cell.day}</Text>
                  <Text style={[styles.paw, !cell.active && styles.pawHidden]}>🐾</Text>
                </>
              )}
            </View>
          ))}
        </View>

        <View style={styles.monthStats}>
          <View style={styles.monthStatItem}>
            <Text style={styles.monthStatIcon}>🐾</Text>
            <View>
              <Text style={styles.monthStatLabel}>Total walks</Text>
              <Text style={styles.monthStatValue}>{monthWalks.length}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.monthStatItem}>
            <Text style={styles.monthStatIcon}>⛰️</Text>
            <View>
              <Text style={styles.monthStatLabel}>Total distance</Text>
              <Text style={styles.monthStatValue}>{monthDistance.toFixed(1)} km</Text>
            </View>
          </View>
        </View>
      </View>

      <Pressable style={styles.startButton} onPress={onStartWalk}>
        <Text style={styles.startButtonText}>🐾  START WALK</Text>
      </Pressable>

      <View style={styles.activityCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Activity</Text>
          <Text style={styles.seeAll}>See all  ›</Text>
        </View>
        {todayWalks.length > 0 ? (
          <View style={styles.activityRow}>
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapPlaceholderText}>〰️</Text>
            </View>
            <View style={styles.activityText}>
              <Text style={styles.activityTitle}>Latest Walk</Text>
              <Text style={styles.activityMeta}>
                {todayWalks[0].distance_km.toFixed(2)} km  ·  {Math.round(todayWalks[0].duration_seconds / 60)} min
              </Text>
            </View>
            <Text style={styles.boops}>♡</Text>
          </View>
        ) : (
          <Text style={styles.emptyText}>No walk yet today. Janggo is waiting 👀</Text>
        )}
      </View>

      <View style={styles.quickRow}>
        <View style={styles.quickCard}>
          <Text style={styles.quickIcon}>🏆</Text>
          <Text style={styles.quickTitle}>Leaderboard</Text>
          <Text style={styles.quickText}>See your local rank</Text>
        </View>
        <View style={styles.quickCard}>
          <Text style={styles.quickIcon}>📊</Text>
          <Text style={styles.quickTitle}>Stats</Text>
          <Text style={styles.quickText}>Your data playground</Text>
        </View>
        <View style={styles.quickCard}>
          <Text style={styles.quickIcon}>🏅</Text>
          <Text style={styles.quickTitle}>Challenges</Text>
          <Text style={styles.quickText}>Earn weird little badges</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  logo: { fontSize: 46, fontWeight: "700", letterSpacing: 3, color: "#1D1A17" },
  streak: { marginTop: 10, fontSize: 24, fontWeight: "700", color: "#E87859" },
  profileBubble: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#F1E7D7", alignItems: "center", justifyContent: "center" },
  profileDog: { fontSize: 34 },
  calendarCard: { backgroundColor: "#FFFDF8", borderRadius: 28, padding: 22, shadowColor: "#6A5B47", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
  monthTitle: { textAlign: "center", fontSize: 24, fontWeight: "600", color: "#2B251F", marginBottom: 18 },
  weekRow: { flexDirection: "row", marginBottom: 8 },
  weekLabel: { width: "14.2857%", textAlign: "center", fontSize: 12, color: "#756B60" },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { width: "14.2857%", height: 48, alignItems: "center", justifyContent: "center" },
  dayNumber: { fontSize: 15, color: "#2D2823" },
  paw: { fontSize: 11, marginTop: 2 },
  pawHidden: { opacity: 0 },
  monthStats: { flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: "#EEE5D7", marginTop: 16, paddingTop: 18 },
  monthStatItem: { flex: 1, flexDirection: "row", gap: 12, alignItems: "center" },
  monthStatIcon: { fontSize: 24 },
  monthStatLabel: { fontSize: 13, color: "#756B60" },
  monthStatValue: { marginTop: 2, fontSize: 24, fontWeight: "700", color: "#1D1A17" },
  divider: { width: 1, height: 42, backgroundColor: "#EEE5D7", marginHorizontal: 14 },
  startButton: { marginTop: 18, backgroundColor: "#8C9670", borderRadius: 24, paddingVertical: 20, alignItems: "center" },
  startButtonText: { color: "#FFFDF8", fontSize: 21, fontWeight: "700", letterSpacing: 2 },
  activityCard: { marginTop: 18, backgroundColor: "#FFFDF8", borderRadius: 24, padding: 18, shadowColor: "#6A5B47", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 1 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontSize: 22, fontWeight: "700", color: "#1D1A17" },
  seeAll: { fontSize: 15, color: "#665C52" },
  activityRow: { flexDirection: "row", alignItems: "center" },
  mapPlaceholder: { width: 90, height: 74, borderRadius: 16, backgroundColor: "#DCE5C3", alignItems: "center", justifyContent: "center" },
  mapPlaceholderText: { fontSize: 34, color: "#687451" },
  activityText: { flex: 1, marginLeft: 14 },
  activityTitle: { fontSize: 18, fontWeight: "700", color: "#1D1A17" },
  activityMeta: { marginTop: 8, fontSize: 15, color: "#514A43" },
  boops: { fontSize: 30, color: "#7B875D" },
  emptyText: { color: "#756B60", fontSize: 15 },
  quickRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  quickCard: { flex: 1, minHeight: 150, backgroundColor: "#FFFDF8", borderRadius: 22, padding: 14, justifyContent: "flex-start", shadowColor: "#6A5B47", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 1 },
  quickIcon: { fontSize: 30, marginBottom: 12 },
  quickTitle: { fontSize: 16, fontWeight: "700", color: "#1D1A17" },
  quickText: { marginTop: 6, fontSize: 12, lineHeight: 17, color: "#6A625A" },
});
