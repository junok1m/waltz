import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { Dog } from "../types/dog";
import type { Walk } from "../types/walk";
import { BottomNav } from "./BottomNav";
import type { AppTab } from "./HubScreen";

export function ReportScreen({ walks, dog, onNavigate, onStartWalk }: { walks: Walk[]; dog: Dog; onNavigate: (tab: AppTab) => void; onStartWalk: () => void }) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}><Text style={styles.title}>Report</Text></View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.paper}>
          <Text style={styles.brand}>WALTZ</Text>
          <Text style={styles.document}>WALK REPORT</Text>
          <Text style={styles.copy}>{dog.name} · {walks.length} waltzes</Text>
        </View>
      </ScrollView>
      <BottomNav active="map" onNavigate={onNavigate} onStartPress={onStartWalk} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "space-between" },
  header: { alignItems: "center", marginBottom: 18 },
  title: { fontFamily: "Schoolbell_400Regular", fontSize: 34, color: "#1D1A17" },
  content: { paddingBottom: 26 },
  paper: { backgroundColor: "#FFFDF8", borderWidth: 1, borderColor: "#DED6CA", borderRadius: 18, padding: 20 },
  brand: { fontSize: 11, fontWeight: "900", letterSpacing: 4, color: "#78845C", textAlign: "center" },
  document: { fontFamily: "Schoolbell_400Regular", fontSize: 31, color: "#1D1A17", textAlign: "center", marginTop: 2 },
  copy: { marginTop: 20, fontSize: 12, color: "#756B60" },
});
