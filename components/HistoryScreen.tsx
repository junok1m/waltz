import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { DogBadge } from "../types/badge";
import { Dog } from "../types/dog";
import { Walk } from "../types/walk";
import { AppTab } from "./HubScreen";
import { BottomNav } from "./BottomNav";
import { ReportEssentials, ReportPeriod } from "./ReportEssentials";
import { ReportWalkDetails } from "./ReportWalkDetails";
import { WalkingHeatmap } from "./WalkingHeatmap";
import { PersonalRecords } from "./PersonalRecords";
import { MonthlyComparison } from "./MonthlyComparison";
import { WaltzTimePattern } from "./WaltzTimePattern";
import { RoutePrivacyPersonality } from "./RoutePrivacyPersonality";

type Props = { dog: Dog; walks: Walk[]; badges: DogBadge[]; onNavigate: (tab: AppTab) => void; onStartWalk: () => void };

export function HistoryScreen({ dog, walks, onNavigate, onStartWalk }: Props) {
  const [period, setPeriod] = useState<ReportPeriod>("week");
  return <View style={styles.screen}>
    <View style={styles.header}><Text style={styles.title}>Report</Text></View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ReportEssentials walks={walks} period={period} onPeriodChange={setPeriod} />
      <ReportWalkDetails walks={walks} period={period} />
      <View style={styles.moreHeader}><Text style={styles.moreTitle}>More about {dog.name}</Text><Text style={styles.moreCopy}>The curious stuff. Fun, but never in the way.</Text></View>
      <WalkingHeatmap walks={walks} />
      <PersonalRecords walks={walks} />
      <MonthlyComparison walks={walks} />
      <WaltzTimePattern walks={walks} />
      <RoutePrivacyPersonality walks={walks} />
    </ScrollView>
    <BottomNav active="map" onNavigate={onNavigate} onStartPress={onStartWalk} />
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "space-between" },
  header: { alignItems: "center", marginBottom: 10 },
  title: { fontFamily: "Schoolbell_400Regular", fontSize: 34, color: "#1D1A17" },
  content: { paddingBottom: 28, gap: 13 },
  moreHeader: { marginTop: 12 },
  moreTitle: { fontFamily: "Schoolbell_400Regular", fontSize: 29, color: "#1D1A17" },
  moreCopy: { fontSize: 11, color: "#82786E", marginTop: 2 },
});
