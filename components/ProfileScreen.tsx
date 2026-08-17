import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { signOut } from "../services/auth";
import { Dog } from "../types/dog";
import { Walk } from "../types/walk";

type Props = {
  session: Session;
  dogs: Dog[];
  activeDogId: string;
  walks: Walk[];
  onSelectDog: (dogId: string) => void;
  onAddDog: () => void;
  onBackHome: () => void;
};

function dogAge(dog: Dog) {
  const now = new Date();
  let age = now.getFullYear() - dog.birth_year;
  if (dog.birth_month) {
    const monthHasPassed = now.getMonth() + 1 > dog.birth_month;
    const sameMonthDayHasPassed =
      now.getMonth() + 1 === dog.birth_month && (!dog.birth_day || now.getDate() >= dog.birth_day);
    if (!monthHasPassed && !sameMonthDayHasPassed) age -= 1;
  }
  return Math.max(0, age);
}

function birthdayLabel(dog: Dog) {
  if (!dog.birth_month) return `${dog.birth_year}`;
  const month = String(dog.birth_month).padStart(2, "0");
  const day = dog.birth_day ? `-${String(dog.birth_day).padStart(2, "0")}` : "";
  return `${dog.birth_year}-${month}${day}`;
}

export function ProfileScreen({
  session,
  dogs,
  activeDogId,
  walks,
  onSelectDog,
  onAddDog,
  onBackHome,
}: Props) {
  const activeDog = dogs.find((dog) => dog.id === activeDogId) ?? dogs[0];
  const totalDistance = walks.reduce((sum, walk) => sum + walk.distance_km, 0);
  const email = session.user.email ?? "Signed in with Google";

  async function logOut() {
    try {
      await signOut();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Couldn’t log out";
      Alert.alert("Log out failed", message);
    }
  }

  if (!activeDog) return null;

  return (
    <View style={styles.screen}>
      <View style={styles.topRow}>
        <Pressable onPress={onBackHome} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.logo}>me</Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarDog}>🐕</Text>
          </View>
          <Text style={styles.dogName}>{activeDog.name}</Text>
          <Text style={styles.dogMeta}>
            {activeDog.breed || "Very good dog"} · {dogAge(activeDog)} yr{dogAge(activeDog) === 1 ? "" : "s"}
          </Text>
          <Text style={styles.birthday}>🎂 {birthdayLabel(activeDog)}</Text>
        </View>

        <View style={styles.dogSwitcherHeader}>
          <Text style={styles.sectionTitle}>Your dogs</Text>
          <Pressable onPress={onAddDog}>
            <Text style={styles.addDog}>＋ Add dog</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dogChips}>
          {dogs.map((dog) => {
            const selected = dog.id === activeDog.id;
            return (
              <Pressable
                key={dog.id}
                onPress={() => onSelectDog(dog.id)}
                style={[styles.dogChip, selected && styles.dogChipSelected]}
              >
                <Text style={styles.dogChipEmoji}>🐾</Text>
                <Text style={[styles.dogChipText, selected && styles.dogChipTextSelected]}>{dog.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Lifetime together</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{walks.length}</Text>
              <Text style={styles.statLabel}>walks</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalDistance.toFixed(1)}</Text>
              <Text style={styles.statLabel}>km</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>boops</Text>
            </View>
          </View>
        </View>

        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingTitle}>Account</Text>
              <Text style={styles.settingValue}>{email}</Text>
            </View>
          </View>
          <View style={styles.rule} />
          <Pressable style={styles.settingRow}>
            <Text style={styles.settingTitle}>Edit dog profile</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <View style={styles.rule} />
          <Pressable style={styles.settingRow}>
            <Text style={styles.settingTitle}>Settings</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        <Pressable onPress={logOut} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topRow: { height: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 36, lineHeight: 38, color: "#2C2824" },
  logo: { fontFamily: "Schoolbell_400Regular", fontSize: 42, color: "#1D1A17" },
  topSpacer: { width: 44 },
  scrollContent: { paddingBottom: 28, gap: 16 },
  heroCard: { backgroundColor: "#FFFDF8", borderRadius: 28, padding: 22, alignItems: "center" },
  avatar: { width: 92, height: 92, borderRadius: 46, backgroundColor: "#F0E6D6", alignItems: "center", justifyContent: "center" },
  avatarDog: { fontSize: 48 },
  dogName: { marginTop: 12, fontSize: 30, fontWeight: "800", color: "#1D1A17" },
  dogMeta: { marginTop: 4, fontSize: 14, color: "#6D645B" },
  birthday: { marginTop: 8, fontSize: 13, color: "#8A8077" },
  dogSwitcherHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#27231F" },
  addDog: { fontSize: 14, fontWeight: "700", color: "#78845C" },
  dogChips: { gap: 9, paddingRight: 18 },
  dogChip: { minWidth: 92, height: 44, borderRadius: 22, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#FFFDF8", borderWidth: 1, borderColor: "#E8DFD3" },
  dogChipSelected: { backgroundColor: "#8C9670", borderColor: "#8C9670" },
  dogChipEmoji: { fontSize: 16 },
  dogChipText: { fontSize: 14, fontWeight: "700", color: "#39332D" },
  dogChipTextSelected: { color: "#FFFDF8" },
  statsCard: { backgroundColor: "#FFFDF8", borderRadius: 24, padding: 18 },
  statsRow: { marginTop: 16, flexDirection: "row", alignItems: "center" },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 26, fontWeight: "800", color: "#1D1A17" },
  statLabel: { marginTop: 3, fontSize: 11, color: "#82786F" },
  statDivider: { width: 1, height: 34, backgroundColor: "#E8DFD3" },
  settingsCard: { backgroundColor: "#FFFDF8", borderRadius: 24, paddingHorizontal: 18 },
  settingRow: { minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  settingTitle: { fontSize: 15, fontWeight: "700", color: "#302B26" },
  settingValue: { marginTop: 3, fontSize: 11, color: "#8A8178" },
  rule: { height: 1, backgroundColor: "#EEE6DB" },
  chevron: { fontSize: 24, color: "#8A8178" },
  logoutButton: { minHeight: 52, borderRadius: 18, borderWidth: 1, borderColor: "#E8BDB2", alignItems: "center", justifyContent: "center" },
  logoutText: { fontSize: 15, fontWeight: "700", color: "#C76555" },
});
