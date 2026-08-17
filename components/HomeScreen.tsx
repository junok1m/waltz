import { Pressable, StyleSheet, Text, View } from "react-native";
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

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.logo}>waltz</Text>
          <Text style={styles.streak}>🔥 {streak} day{streak === 1 ? "" : "s"} streak</Text>
        </View>
        <View style={styles.profileBubble}>
          <Text style={styles.profileDog}>🐕</Text>
        </View>
      </View>

      <View style={styles.dashboard}>
        <View style={styles.calendarCard}>
          <View style={styles.monthHeader}>
            <Text style={styles.monthArrow}>‹</Text>
            <Text style={styles.monthTitle}>{monthFormatter.format(now)}</Text>
            <Text style={styles.monthArrow}>›</Text>
          </View>

          <View style={styles.weekRow}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <Text key={day} style={styles.weekLabel}>{day}</Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendar.map((cell, index) => (
              <View key={`${cell.day ?? "blank"}-${index}`} style={styles.dayCell}>
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

        <View style={styles.quickRow}>
          <Pressable style={styles.quickCard}>
            <View style={[styles.quickIconBubble, styles.trophyBubble]}>
              <Text style={styles.quickIcon}>🏆</Text>
            </View>
            <Text style={styles.quickTitle}>Leaderboard</Text>
            <Text style={styles.quickText}>See how you rank</Text>
            <Text style={styles.quickArrow}>›</Text>
          </Pressable>

          <Pressable style={styles.quickCard}>
            <View style={[styles.quickIconBubble, styles.statsBubble]}>
              <Text style={styles.quickIcon}>📊</Text>
            </View>
            <Text style={styles.quickTitle}>Stats</Text>
            <Text style={styles.quickText}>Your data playground</Text>
            <Text style={styles.quickArrow}>›</Text>
          </Pressable>

          <Pressable style={styles.quickCard}>
            <View style={[styles.quickIconBubble, styles.challengeBubble]}>
              <Text style={styles.quickIcon}>🏅</Text>
            </View>
            <Text style={styles.quickTitle}>Challenges</Text>
            <Text style={styles.quickText}>Earn weird little badges</Text>
            <Text style={styles.quickArrow}>›</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.bottomNav}>
        <View style={styles.navItem}>
          <Text style={styles.navIconActive}>⌂</Text>
          <Text style={styles.navLabelActive}>Home</Text>
        </View>
        <View style={styles.navItem}>
          <Text style={styles.navIcon}>⌖</Text>
          <Text style={styles.navLabel}>Map</Text>
        </View>

        <Pressable style={styles.pawNavButton} onPress={onStartWalk}>
          <Text style={styles.pawNavIcon}>🐾</Text>
        </Pressable>

        <View style={styles.navItem}>
          <Text style={styles.navIcon}>♡</Text>
          <Text style={styles.navLabel}>Community</Text>
        </View>
        <View style={styles.navItem}>
          <Text style={styles.navIcon}>♙</Text>
          <Text style={styles.navLabel}>Me</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  logo: {
    fontFamily: "Schoolbell_400Regular",
    fontSize: 52,
    letterSpacing: 1,
    color: "#1D1A17",
    lineHeight: 56,
  },
  streak: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: "700",
    color: "#E87859",
  },
  profileBubble: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#F1E7D7",
    alignItems: "center",
    justifyContent: "center",
  },
  profileDog: { fontSize: 30 },

  dashboard: {
    flex: 1,
    justifyContent: "space-between",
    paddingBottom: 10,
  },
  calendarCard: {
    backgroundColor: "#FFFDF8",
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    shadowColor: "#6A5B47",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  monthArrow: { fontSize: 28, color: "#2B251F", paddingHorizontal: 4 },
  monthTitle: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "600",
    color: "#2B251F",
  },
  weekRow: { flexDirection: "row", marginBottom: 1 },
  weekLabel: {
    width: "14.2857%",
    textAlign: "center",
    fontSize: 11,
    color: "#756B60",
  },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: {
    width: "14.2857%",
    height: 35,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumber: { fontSize: 14, color: "#2D2823", lineHeight: 17 },
  paw: { fontSize: 9, marginTop: -1, lineHeight: 10 },
  pawHidden: { opacity: 0 },
  monthStats: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#EEE5D7",
    marginTop: 8,
    paddingTop: 10,
  },
  monthStatItem: {
    flex: 1,
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  monthStatIcon: { fontSize: 21 },
  monthStatLabel: { fontSize: 12, color: "#756B60" },
  monthStatValue: {
    marginTop: 1,
    fontSize: 22,
    fontWeight: "700",
    color: "#1D1A17",
  },
  divider: {
    width: 1,
    height: 38,
    backgroundColor: "#EEE5D7",
    marginHorizontal: 10,
  },

  startButton: {
    backgroundColor: "#8C9670",
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: "center",
  },
  startButtonText: {
    fontFamily: "Schoolbell_400Regular",
    color: "#FFFDF8",
    fontSize: 26,
    letterSpacing: 1.5,
  },

  quickRow: { flexDirection: "row", gap: 8 },
  quickCard: {
    flex: 1,
    height: 122,
    backgroundColor: "#FFFDF8",
    borderRadius: 20,
    padding: 11,
    shadowColor: "#6A5B47",
    shadowOpacity: 0.05,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1,
  },
  quickIconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },
  trophyBubble: { backgroundColor: "#F6EBC4" },
  statsBubble: { backgroundColor: "#E5EBDD" },
  challengeBubble: { backgroundColor: "#F7DDD4" },
  quickIcon: { fontSize: 22 },
  quickTitle: { fontSize: 14, fontWeight: "700", color: "#1D1A17" },
  quickText: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 13,
    color: "#6A625A",
    paddingRight: 8,
  },
  quickArrow: {
    position: "absolute",
    right: 9,
    bottom: 8,
    fontSize: 22,
    color: "#423C36",
  },

  bottomNav: {
    height: 68,
    borderRadius: 25,
    backgroundColor: "#FFFDF8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 4,
    shadowColor: "#6A5B47",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  navItem: { width: 60, alignItems: "center", justifyContent: "center" },
  navIcon: { fontSize: 23, color: "#332E29" },
  navIconActive: { fontSize: 23, color: "#78845C" },
  navLabel: { marginTop: 2, fontSize: 10, color: "#443D37" },
  navLabelActive: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "700",
    color: "#78845C",
  },
  pawNavButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#89936B",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -22,
    shadowColor: "#53603E",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  pawNavIcon: { fontSize: 27 },
});
