import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SquareArrowLeft } from "@sketchyicons/react-native";
import { BottomNav } from "./BottomNav";
import { ChallengeInfo, HubChallenges, HubLeaderboard, HubStats } from "./HubSections";
import { Dog } from "../types/dog";
import { Walk } from "../types/walk";

export type AppTab = "home" | "club" | "community" | "me" | "report" | "leaderboard" | "stats" | "achievements" | "places";
type HubTab = Extract<AppTab, "leaderboard" | "stats" | "achievements">;
type Props = { tab: HubTab; walks: Walk[]; dog: Dog; onNavigate: (tab: AppTab) => void; onStartWalk: () => void };

export function HubScreen({ tab, walks, dog, onNavigate, onStartWalk }: Props) {
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeInfo | null>(null);
  const title = { leaderboard: "Ranking", stats: "Stats", achievements: "Achievements" }[tab];

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Pressable style={styles.backButton} onPress={() => onNavigate("club")} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back to Club">
            <SquareArrowLeft size={23} strokeWidth={2} color="#78845C" />
          </Pressable>
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === "stats" ? <HubStats walks={walks} /> : null}
        {tab === "leaderboard" ? <HubLeaderboard walks={walks} dog={dog} /> : null}
        {tab === "achievements" ? <HubChallenges walks={walks} dog={dog} onSelect={setSelectedChallenge} /> : null}
      </ScrollView>
      <BottomNav active="club" onNavigate={onNavigate} onStartPress={onStartWalk} />
      <Modal visible={!!selectedChallenge} transparent animationType="fade" onRequestClose={() => setSelectedChallenge(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedChallenge(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            {selectedChallenge ? <>
              <View style={[styles.modalBadge, selectedChallenge.done && { backgroundColor: selectedChallenge.color }]}>{selectedChallenge.icon}</View>
              <Text style={styles.modalTitle}>{selectedChallenge.title}</Text>
              <Text style={styles.modalProgress}>{selectedChallenge.progress}</Text>
              <Text style={styles.modalDescription}>{selectedChallenge.description}</Text>
              {selectedChallenge.done ? <Text style={styles.earned}>Badge earned ✓</Text> : null}
              <Pressable style={styles.closeButton} onPress={() => setSelectedChallenge(null)}><Text style={styles.closeText}>Got it</Text></Pressable>
            </> : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "space-between" },
  header: { flexDirection: "row", alignItems: "center", minHeight: 42, marginBottom: 14 },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  backButton: { paddingVertical: 6 },
  title: { fontFamily: "Schoolbell_400Regular", fontSize: 34, color: "#1D1A17" },
  content: { paddingBottom: 24, gap: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,.3)", alignItems: "center", justifyContent: "center", padding: 28 },
  modalCard: { width: "100%", maxWidth: 360, backgroundColor: "#FFFDF8", borderRadius: 30, padding: 26, alignItems: "center" },
  modalBadge: { width: 92, height: 92, borderRadius: 46, borderWidth: 2, borderColor: "#CFC5B7", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  modalTitle: { fontFamily: "Schoolbell_400Regular", fontSize: 30, color: "#1D1A17" },
  modalProgress: { fontSize: 13, fontWeight: "800", color: "#78845C", marginTop: 3 },
  modalDescription: { fontSize: 14, lineHeight: 20, color: "#655D54", textAlign: "center", marginTop: 14 },
  earned: { fontSize: 12, fontWeight: "800", color: "#596442", marginTop: 12 },
  closeButton: { backgroundColor: "#8C9670", paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999, marginTop: 20 },
  closeText: { color: "#FFFDF8", fontWeight: "800" },
});
