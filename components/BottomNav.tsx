import { Pressable, StyleSheet, Text, View } from "react-native";
import { Dog, House, Medal, PawPrint, Rss } from "@sketchyicons/react-native";

export type MainTab = "home" | "club" | "community" | "me";

type Props = {
  active?: MainTab;
  onNavigate: (tab: MainTab) => void;
  onStartPress: () => void;
};

export function BottomNav({ active, onNavigate, onStartPress }: Props) {
  return (
    <View style={styles.nav}>
      <Nav icon={<House size={22} strokeWidth={2} color={color(active === "home")} />} label="Home" active={active === "home"} onPress={() => onNavigate("home")} />
      <Nav icon={<Medal size={22} strokeWidth={2} color={color(active === "club")} />} label="Club" active={active === "club"} onPress={() => onNavigate("club")} />
      <Pressable style={styles.pawButton} onPress={onStartPress} accessibilityRole="button" accessibilityLabel="Start a walk"><PawPrint size={27} strokeWidth={2} color="#FFFDF8" /></Pressable>
      <Nav icon={<Rss size={22} strokeWidth={2} color={color(active === "community")} />} label="Feed" active={active === "community"} onPress={() => onNavigate("community")} />
      <Nav icon={<Dog size={22} strokeWidth={2} color={color(active === "me")} />} label="Me" active={active === "me"} onPress={() => onNavigate("me")} />
    </View>
  );
}

function color(active: boolean) {
  return active ? "#78845C" : "#332E29";
}

function Nav({ icon, label, active, onPress }: { icon: React.ReactNode; label: string; active: boolean; onPress: () => void }) {
  return <Pressable style={styles.navItem} onPress={onPress}>{icon}<Text style={[styles.navLabel, active && styles.active]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  nav: { height: 68, borderRadius: 25, backgroundColor: "#FFFDF8", flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  navItem: { width: 58, alignItems: "center" },
  navLabel: { fontSize: 9, color: "#443D37", marginTop: 2 },
  active: { color: "#78845C", fontWeight: "800" },
  pawButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#89936B", alignItems: "center", justifyContent: "center", marginTop: -20 },
});
