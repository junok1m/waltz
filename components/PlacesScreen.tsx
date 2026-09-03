import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MapPinned, SquareArrowLeft } from "@sketchyicons/react-native";
import { BottomNav } from "./BottomNav";
import type { AppTab } from "./HubScreen";
import { PlacesMap } from "./PlacesMap";
import type { Walk } from "../types/walk";

type Props = {
  walks: Walk[];
  onNavigate: (tab: AppTab) => void;
  onStartWalk: () => void;
};

type PlaceSummary = {
  key: string;
  name: string;
  region: string | null;
  postcode: string | null;
  walkCount: number;
  firstVisited: string;
  lastVisited: string;
  latitudeSum: number;
  longitudeSum: number;
  coordinateCount: number;
};

function placeSummaries(walks: Walk[]): PlaceSummary[] {
  const places = new Map<string, PlaceSummary>();

  for (const walk of walks) {
    const savedPlaces = walk.walk_places?.length
      ? walk.walk_places
      : walk.suburb_name?.trim()
        ? [{
            place_key: `${walk.suburb_name.trim().toLowerCase()}|${walk.location_region ?? ""}|${walk.location_postcode ?? ""}`,
            place_name: walk.suburb_name.trim(),
            region: walk.location_region ?? null,
            postcode: walk.location_postcode ?? null,
            country_code: walk.location_country_code ?? null,
            latitude: walk.location_latitude ?? null,
            longitude: walk.location_longitude ?? null,
            distance_meters: 0,
            visit_order: 0,
          }]
        : [];

    const seenOnWalk = new Set<string>();
    for (const savedPlace of savedPlaces) {
      const name = savedPlace.place_name.trim();
      const key = savedPlace.place_key;
      if (!name || seenOnWalk.has(key)) continue;
      seenOnWalk.add(key);

      const hasCoordinate = Number.isFinite(savedPlace.latitude) && Number.isFinite(savedPlace.longitude);
      const latitude = hasCoordinate ? (savedPlace.latitude as number) : 0;
      const longitude = hasCoordinate ? (savedPlace.longitude as number) : 0;
      const existing = places.get(key);

      if (!existing) {
        places.set(key, {
          key,
          name,
          region: savedPlace.region,
          postcode: savedPlace.postcode,
          walkCount: 1,
          firstVisited: walk.ended_at,
          lastVisited: walk.ended_at,
          latitudeSum: latitude,
          longitudeSum: longitude,
          coordinateCount: hasCoordinate ? 1 : 0,
        });
        continue;
      }

      existing.walkCount += 1;
      if (hasCoordinate) {
        existing.latitudeSum += latitude;
        existing.longitudeSum += longitude;
        existing.coordinateCount += 1;
      }
      if (new Date(walk.ended_at).getTime() < new Date(existing.firstVisited).getTime()) existing.firstVisited = walk.ended_at;
      if (new Date(walk.ended_at).getTime() > new Date(existing.lastVisited).getTime()) existing.lastVisited = walk.ended_at;
    }
  }

  return [...places.values()].sort((a, b) => new Date(b.lastVisited).getTime() - new Date(a.lastVisited).getTime());
}

function shortDate(value: string) {
  return new Date(value).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "Australia/Sydney" });
}

export function PlacesScreen({ walks, onNavigate, onStartWalk }: Props) {
  const places = placeSummaries(walks);
  const mapPlaces = places
    .filter((place) => place.coordinateCount > 0)
    .map((place) => ({
      key: place.key,
      latitude: place.latitudeSum / place.coordinateCount,
      longitude: place.longitudeSum / place.coordinateCount,
    }));

  return (
    <View style={styles.screen}>
      <View style={styles.body}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Pressable style={styles.backButton} onPress={() => onNavigate("club")} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back to Club">
              <SquareArrowLeft size={23} strokeWidth={2} color="#78845C" />
            </Pressable>
            <Text style={styles.title}>Places</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {places.length ? (
            <>
              <PlacesMap places={mapPlaces} />
              <Text style={styles.summary}>{places.length} place{places.length === 1 ? "" : "s"} discovered</Text>
              {places.map((place) => (
                <View key={place.key} style={styles.placeCard}>
                  <View style={styles.icon}>
                    <MapPinned size={24} strokeWidth={2} color="#78845C" />
                  </View>
                  <View style={styles.placeCopy}>
                    <Text style={styles.placeName}>{place.name}</Text>
                    <Text style={styles.placeMeta}>{[place.region, place.postcode].filter(Boolean).join(" · ")}</Text>
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
  header: { flexDirection: "row", alignItems: "center", minHeight: 42, marginBottom: 14 },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  backButton: { paddingVertical: 6 },
  title: { fontFamily: "Schoolbell_400Regular", fontSize: 34, color: "#1D1A17" },
  content: { paddingBottom: 24, gap: 12 },
  summary: { fontSize: 11, fontWeight: "800", color: "#78845C", marginHorizontal: 4, marginTop: 2 },
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
