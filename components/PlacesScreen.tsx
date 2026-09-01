import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MapPinned, SquareArrowLeft } from "@sketchyicons/react-native";
import { BottomNav } from "./BottomNav";
import type { AppTab } from "./HubScreen";
import type { Walk } from "../types/walk";

type Props = {
  walks: Walk[];
  onNavigate: (tab: AppTab) => void;
  onStartWalk: () => void;
};

type PlaceSummary = {
  name: string;
  region: string | null;
  postcode: string | null;
  walkCount: number;
  firstVisited: string;
  lastVisited: string;
};

function placeSummaries(walks: Walk[]): PlaceSummary[] {
  const places = new Map<string, PlaceSummary>();

  for (const walk of walks) {
    const name = walk.suburb_name?.trim();
    if (!name) continue;
    const key = `${name.toLowerCase()}|${walk.location_region ?? ""}|${walk.location_postcode ?? ""}`;
    const existing = places.get(key);
    if (!existing) {
      places.set(key, {
        name,
        region: walk.location_region ?? null,
        postcode: walk.location_postcode ?? null,
        walkCount: 1,
        firstVisited: walk.ended_at,
        lastVisited: walk.ended_at,
      });
      continue;
    }

    existing.walkCount += 1;
    if (new Date(walk.ended_at).getTime() < new Date(existing.firstVisited).getTime()) existing.firstVisited = walk.ended_at;
    if (new Date(walk.ended_at).getTime() > new Date(existing.lastVisited).getTime()) existing.lastVisited = walk.ended_at;
  }

  return [...places.values()].sort((a, b) => new Date(b.lastVisited).getTime() - new Date(a.lastVisited).getTime());
}

function shortDate(value: string) {
  return new Date(value).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "Australia/Sydney" });
}

export function PlacesScreen({ walks, onNavigate, onStartWalk }: Props) {
  const places = placeSummaries(walks);

  return (
    <View style={styles.screen}>
      <View style={styles.body}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => onNavigate("club")} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back to Club">
            <SquareArrowLeft size={23} strokeWidth={2} color="#78845C" />
          </Pressable>
          <Text style={styles.title}>Places</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {places.length ? (
            <>
              <Text style={styles.summary}>{places.length} place{places.length === 1 ? "" : "s"} discovered</Text>
              {places.map((place) => (
                <View key={`${place.name}-${place.postcode ?? ""}`} style={styles.placeCard}>
                  <View style={styles.icon}>
                    <MapPinned size={24} strokeWidth={2} color="#78845C" />
                  </View>
                  <View style={styles.placeCopy}>
                    <Text style={styles.placeName}>{place.name}</Text>
                    <Text style={styles.placeMeta}>
                      {[place.region, place.postcode].filter(Boolean).join(" · ")}
                    </Text>
                    <Text style={styles.placeHistory}>
                      {place.walkCount} walk{place.walkCount === 1 ? "" : "s"} · First {shortDate(place.firstVisited)} · Last {shortDate(place.lastVisited)}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <MapPinned size={30} strokeWidth={2} color="#78845C" />
              </View>
              <Text style={styles.emptyTitle}>Your map starts with the next waltz.</Text>
              <Text style={styles.emptyCopy}>Once walk locations are saved, every suburb, park and favourite wandering spot can live here.</Text>
            </View>
          )}
        </ScrollView>
      </View>

      <BottomNav active="club" onNavigate={onNavigate} onStartPress={onStartWalk} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "space-between" },
  body: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { width: 34, paddingVertical: 6 },
  headerSpacer: { width: 34 },
  title: { fontFamily: "Schoolbell_400Regular", fontSize: 34, color: "#1D1A17" },
  content: { paddingTop: 18, paddingBottom: 24, gap: 12 },
  summary: { fontSize: 11, fontWeight: "800", color: "#78845C", marginHorizontal: 4, marginBottom: 2 },
  placeCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFDF8", borderRadius: 20, padding: 16 },
  icon: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#F2EEE4", alignItems: "center", justifyContent: "center", marginRight: 13 },
  placeCopy: { flex: 1 },
  placeName: { fontFamily: "Schoolbell_400Regular", fontSize: 25, color: "#332E29" },
  placeMeta: { fontSize: 10, fontWeight: "800", color: "#78845C", marginTop: 1 },
  placeHistory: { fontSize: 10, lineHeight: 15, color: "#82786E", marginTop: 5 },
  emptyCard: { backgroundColor: "#FFFDF8", borderRadius: 24, paddingHorizontal: 24, paddingVertical: 34, alignItems: "center" },
  emptyIcon: { width: 62, height: 62, borderRadius: 31, backgroundColor: "#F2EEE4", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  emptyTitle: { fontFamily: "Schoolbell_400Regular", fontSize: 25, color: "#332E29", textAlign: "center" },
  emptyCopy: { fontSize: 12, lineHeight: 18, color: "#82786E", textAlign: "center", marginTop: 8, maxWidth: 280 },
});
