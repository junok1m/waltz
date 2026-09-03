import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Share as NativeShare, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { ArrowLeft, Calendar, Cloudy, Coffee, Ellipsis, Fish, MapPin, MapPlus, Mountain, Ruler, Share, Sun, Timer, Umbrella } from "@sketchyicons/react-native";
import { weatherLabel } from "../services/weather";
import { Walk, WalkTag } from "../types/walk";
import { fallbackWalkTitle } from "./MeActivityCards";
import { WaltzMap } from "./WaltzMap";
import { WalkTagIcons } from "./WalkTagIcons";
import { WobblyFrame } from "./WobblyCard";

type Props = {
  walk: Walk;
  dogName: string;
  onBack: () => void;
  onEdit: (walkId: number, title: string, tags: WalkTag[]) => Promise<void>;
  onHide: (walkId: number) => Promise<void>;
  onDelete: (walkId: number) => Promise<void>;
};

const TAGS: Array<{ value: WalkTag; label: string; icon: React.ReactNode }> = [
  { value: "trail", label: "Trail", icon: <Mountain size={18} strokeWidth={2} color="#78845C" /> },
  { value: "swim", label: "Gone fishing", icon: <Fish size={18} strokeWidth={2} color="#78845C" /> },
  { value: "coffee", label: "Coffee stop", icon: <Coffee size={18} strokeWidth={2} color="#78845C" /> },
];

function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function WeatherIcon({ condition }: { condition: NonNullable<Walk["weather_condition"]> }) {
  const props = { size: 22, strokeWidth: 2, color: "#78845C" } as const;
  if (condition === "clear") return <Sun {...props} />;
  if (["drizzle", "rain", "heavy_rain", "storm"].includes(condition)) return <Umbrella {...props} />;
  return <Cloudy {...props} />;
}

export function WalkDetailScreen({ walk, dogName, onBack, onEdit, onHide, onDelete }: Props) {
  const { height } = useWindowDimensions();
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(walk.title?.trim() || fallbackWalkTitle(walk.ended_at));
  const [draftTags, setDraftTags] = useState<WalkTag[]>(walk.tags ?? []);
  const [saving, setSaving] = useState(false);
  const title = walk.title?.trim() || fallbackWalkTitle(walk.ended_at);
  const points = walk.route_points ?? [];
  const visibility = walk.route_visibility ?? (walk.share_route ? "full" : "private");
  const visibilityLabel = { private: "Only me", stats_only: "Stats only", hidden_ends: "Start & finish hidden", full: "Full route" }[visibility];
  const date = new Date(walk.ended_at).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Australia/Sydney" });
  const places = [...new Set([...(walk.walk_places ?? [])]
    .sort((a, b) => a.visit_order - b.visit_order)
    .map((place) => place.place_name))];
  const shownPlaces = places.length ? places : walk.suburb_name ? [walk.suburb_name] : [];
  const location = shownPlaces.join(" · ");
  const weather = walk.weather_temperature_c != null && walk.weather_condition
    ? weatherLabel({ temperatureC: walk.weather_temperature_c, condition: walk.weather_condition, code: walk.weather_code ?? null })
    : null;

  useEffect(() => {
    setDraftTitle(title);
    setDraftTags(walk.tags ?? []);
  }, [title, walk.tags]);

  function openMenu() {
    Alert.alert(title, "What would you like to do?", [
      { text: "Edit waltz", onPress: () => setEditing(true) },
      {
        text: "Hide from profile",
        onPress: () => onHide(walk.id).catch((error) => Alert.alert("Couldn't hide waltz", error instanceof Error ? error.message : "Unknown error")),
      },
      { text: "Delete waltz", style: "destructive", onPress: confirmDelete },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  function confirmDelete() {
    Alert.alert("Delete this waltz?", "This removes it from Report and your stats too.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => onDelete(walk.id).catch((error) => Alert.alert("Couldn't delete waltz", error instanceof Error ? error.message : "Unknown error")),
      },
    ]);
  }

  async function shareWalk() {
    const locationCopy = location ? ` · ${location}` : "";
    await NativeShare.share({
      title,
      message: `${dogName}'s ${title}\n${walk.distance_km.toFixed(2)} km · ${formatDuration(walk.duration_seconds)}${locationCopy}\nShared from Waltz`,
    });
  }

  async function saveEdit() {
    const nextTitle = draftTitle.trim() || fallbackWalkTitle(walk.ended_at);
    setSaving(true);
    try {
      await onEdit(walk.id, nextTitle, draftTags);
      setEditing(false);
    } catch (error) {
      Alert.alert("Couldn't update waltz", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  function toggleTag(tag: WalkTag) {
    setDraftTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <View style={styles.topTitleRow}>
          <Pressable style={styles.iconButton} onPress={onBack} hitSlop={8} accessibilityLabel="Back"><ArrowLeft size={27} strokeWidth={2} color="#332E29" /></Pressable>
          <Text style={styles.topTitle} numberOfLines={1}>{title}</Text>
        </View>
        <View style={styles.topActions}>
          <Pressable style={styles.iconButton} onPress={() => { void shareWalk(); }} hitSlop={8} accessibilityLabel="Share waltz"><Share size={24} strokeWidth={2} color="#78845C" /></Pressable>
          <Pressable style={styles.iconButton} onPress={openMenu} hitSlop={8} accessibilityLabel="Waltz options"><Ellipsis size={27} strokeWidth={2} color="#655D54" /></Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <WobblyFrame style={[styles.map, { height: Math.max(280, Math.min(390, height * 0.43)) }]}>
          {points.length && visibility !== "stats_only"
            ? <WaltzMap points={points} dogName={dogName} interactive />
            : <View style={styles.noMap}><MapPin size={38} strokeWidth={2} color="#8C9670" /><Text style={styles.noMapTitle}>Route tucked away</Text><Text style={styles.noMapCopy}>This waltz was saved without a map.</Text></View>}
          <View pointerEvents="none" style={styles.routePill}><Text style={styles.routePillText}>{visibilityLabel}</Text></View>
        </WobblyFrame>

        <View style={styles.dateAndTags}>
          <View style={styles.dateRow}><Calendar size={18} strokeWidth={2} color="#82786E" /><Text style={styles.date}>{date}</Text></View>
          <WalkTagIcons tags={walk.tags} />
        </View>

        <View style={styles.statsRow}>
          <Stat icon={<Ruler size={25} strokeWidth={2} color="#78845C" />} value={`${walk.distance_km.toFixed(2)} km`} />
          <Stat icon={<Timer size={25} strokeWidth={2} color="#78845C" />} value={formatDuration(walk.duration_seconds)} />
          {weather && walk.weather_condition
            ? <Stat icon={<WeatherIcon condition={walk.weather_condition} />} value={weather} />
            : null}
        </View>

        {shownPlaces.length ? <View style={styles.places}>{shownPlaces.map((place) => <View key={place} style={styles.placeRow}><MapPlus size={23} strokeWidth={2} color="#78845C" /><Text style={styles.placeName}>{place}</Text></View>)}</View> : null}
      </ScrollView>

      <Modal visible={editing} transparent animationType="slide" onRequestClose={() => setEditing(false)}>
        <Pressable style={styles.scrim} onPress={() => setEditing(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>Edit waltz</Text>
            <Text style={styles.fieldLabel}>ACTIVITY TITLE</Text>
            <TextInput value={draftTitle} onChangeText={setDraftTitle} maxLength={60} autoFocus style={styles.input} placeholder="Morning waltz" />
            <Text style={styles.fieldLabel}>TAGS</Text>
            <View style={styles.tagsRow}>{TAGS.map((tag) => {
              const selected = draftTags.includes(tag.value);
              return <Pressable key={tag.value} onPress={() => toggleTag(tag.value)} style={[styles.tag, selected && styles.tagSelected]}>{tag.icon}<Text style={[styles.tagText, selected && styles.tagTextSelected]}>{tag.label}</Text></Pressable>;
            })}</View>
            <Pressable disabled={saving} style={[styles.saveButton, saving && styles.disabled]} onPress={() => { void saveEdit(); }}><Text style={styles.saveText}>{saving ? "SAVING..." : "SAVE CHANGES"}</Text></Pressable>
            <Pressable disabled={saving} onPress={() => setEditing(false)}><Text style={styles.cancelText}>Cancel</Text></Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function Stat({ icon, value }: { icon: React.ReactNode; value: string }) {
  return <View style={styles.stat}><View style={styles.statIcon}>{icon}</View><Text style={styles.statValue} numberOfLines={1}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  topTitleRow: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 5 },
  topTitle: { flex: 1, fontFamily: "Schoolbell_400Regular", fontSize: 25, color: "#1D1A17" },
  topActions: { flexDirection: "row", alignItems: "center", gap: 5 },
  iconButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  content: { paddingBottom: 34, gap: 18 },
  map: { backgroundColor: "#F8F3E9" },
  noMap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 7, padding: 28 },
  noMapTitle: { fontFamily: "Schoolbell_400Regular", fontSize: 26, color: "#332E29" },
  noMapCopy: { color: "#82786E", fontSize: 12 },
  routePill: { position: "absolute", left: 13, bottom: 13, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: "rgba(255,253,248,.92)", borderWidth: 1, borderColor: "#D8D1C7" },
  routePillText: { fontSize: 10, fontWeight: "800", color: "#78845C" },
  dateAndTags: { minHeight: 30, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingHorizontal: 7 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  date: { fontSize: 13, color: "#82786E" },
  statsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingVertical: 3 },
  stat: { minWidth: 88, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  statIcon: { justifyContent: "center" },
  statValue: { fontSize: 14, fontWeight: "800", color: "#655D54" },
  places: { gap: 12, paddingHorizontal: 8, paddingTop: 2 },
  placeRow: { flexDirection: "row", alignItems: "center", gap: 11 },
  placeName: { fontSize: 15, fontWeight: "700", color: "#332E29" },
  scrim: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(29,26,23,.25)" },
  sheet: { backgroundColor: "#F8F3E9", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingTop: 23, paddingBottom: 34, gap: 11 },
  sheetTitle: { fontFamily: "Schoolbell_400Regular", fontSize: 31, color: "#1D1A17", marginBottom: 3 },
  fieldLabel: { fontSize: 9, fontWeight: "800", color: "#82786E", marginTop: 3 },
  input: { minHeight: 48, borderRadius: 14, backgroundColor: "#FFFDF8", paddingHorizontal: 14, fontSize: 16, fontWeight: "700", color: "#1D1A17", borderWidth: 1, borderColor: "#E5E0D8" },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 9, paddingHorizontal: 11, borderRadius: 999, backgroundColor: "#F1E7D7", borderWidth: 1, borderColor: "transparent" },
  tagSelected: { backgroundColor: "#E6EAD9", borderColor: "#8C9670" },
  tagText: { fontSize: 11, fontWeight: "700", color: "#655D54" },
  tagTextSelected: { color: "#596442" },
  saveButton: { minHeight: 50, borderRadius: 999, backgroundColor: "#8C9670", alignItems: "center", justifyContent: "center", marginTop: 6 },
  saveText: { fontFamily: "Schoolbell_400Regular", fontSize: 21, color: "#FFFDF8", letterSpacing: 1 },
  disabled: { opacity: 0.55 },
  cancelText: { textAlign: "center", color: "#756B60", fontSize: 13, paddingTop: 3 },
});
