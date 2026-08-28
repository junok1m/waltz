import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ArrowLeft, Dog as DogIcon } from "@sketchyicons/react-native";
import type { AppTab } from "./HubScreen";
import type { PublicDogProfile } from "../services/publicProfile";
import { fetchPublicDogProfile } from "../services/publicProfile";
import { calculateWalkStreak } from "../utils/streak";
import { dogAvatarSource } from "../utils/mockDogAvatars";
import { BadgeIcon } from "./BadgeIcon";
import { BottomNav } from "./BottomNav";
import { MeWalkActivityCard } from "./MeActivityCards";
import { WaltzErrorScreen } from "./WaltzErrorScreen";
import { WaltzLoadingScreen } from "./WaltzLoadingScreen";

type Props = {
  dogId: string;
  onBack: () => void;
  onNavigate: (tab: AppTab) => void;
  onStartWalk: () => void;
};

function ageLabel(profile: PublicDogProfile) {
  const { birth_year, birth_month, birth_day } = profile.dog;
  const now = new Date();
  let age = now.getFullYear() - birth_year;
  const month = (birth_month ?? 1) - 1;
  const day = birth_day ?? 1;
  if (now.getMonth() < month || (now.getMonth() === month && now.getDate() < day)) age -= 1;
  return `${Math.max(0, age)} year${age === 1 ? "" : "s"} old`;
}

export function PublicDogProfileScreen({ dogId, onBack, onNavigate, onStartWalk }: Props) {
  const [profile, setProfile] = useState<PublicDogProfile | null>(null);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    setProfile(null);
    setError(false);
    fetchPublicDogProfile(dogId)
      .then((value) => { if (active) setProfile(value); })
      .catch((reason) => {
        console.error("Load public dog profile error:", reason);
        if (active) setError(true);
      });
    return () => { active = false; };
  }, [dogId, retryKey]);

  const totals = useMemo(() => {
    if (!profile) return { distance: 0, streak: 0 };
    return {
      distance: profile.walks.reduce((sum, walk) => sum + walk.distance_km, 0),
      streak: calculateWalkStreak(profile.walks),
    };
  }, [profile]);

  if (error) return <WaltzErrorScreen title="Lost this trail" copy="Waltz couldn't load this dog's public profile." onRetry={() => setRetryKey((value) => value + 1)} />;
  if (!profile) return <WaltzLoadingScreen />;

  const { dog, walks, badges } = profile;
  const detail = [dog.breed, ageLabel(profile), dog.weight_kg ? `${dog.weight_kg} kg` : null].filter(Boolean).join(" · ");
  const avatarSource = dogAvatarSource(dog.id, dog.avatar_url);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onBack} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back to feed">
          <ArrowLeft size={22} strokeWidth={2} color="#78845C" />
        </Pressable>
        <Text style={styles.title}>{dog.name}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profile}>
          {avatarSource
            ? <Image source={avatarSource} style={styles.avatar} />
            : <View style={styles.avatarFallback}><DogIcon size={48} strokeWidth={1.8} color="#78845C" /></View>}
          <Text style={styles.profileLine}>{dog.profile_line || "Very good dog"}</Text>
          {detail ? <Text style={styles.detail}>{detail}</Text> : null}
          <View style={styles.summary}>
            <Summary value={String(walks.length)} label="public waltzes" />
            <Summary value={`${totals.distance.toFixed(1)} km`} label="shared distance" />
            <Summary value={String(totals.streak)} label="day streak" />
          </View>
        </View>

        {badges.length ? (
          <View>
            <Text style={styles.sectionTitle}>Stamps</Text>
            <View style={styles.badges}>{badges.map((badge) => <BadgeIcon key={badge.id} badgeId={badge.badge_id} size={48} labelLines={2} />)}</View>
          </View>
        ) : null}

        <View>
          <Text style={styles.sectionTitle}>Recent waltzes</Text>
          <Text style={styles.sectionCopy}>Public adventures from {dog.name}, newest first.</Text>
          <View style={styles.walks}>
            {walks.length
              ? walks.slice(0, 8).map((walk) => <MeWalkActivityCard key={walk.id} walk={walk} />)
              : <Text style={styles.empty}>No public waltzes yet.</Text>}
          </View>
        </View>
      </ScrollView>

      <BottomNav active="community" onNavigate={onNavigate} onStartPress={onStartWalk} />
    </View>
  );
}

function Summary({ value, label }: { value: string; label: string }) {
  return <View style={styles.summaryItem}><Text style={styles.summaryValue}>{value}</Text><Text style={styles.summaryLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "space-between" },
  header: { minHeight: 42, flexDirection: "row", alignItems: "center", marginBottom: 14 },
  backButton: { paddingVertical: 8, paddingRight: 12 },
  title: { fontFamily: "Schoolbell_400Regular", fontSize: 34, color: "#1D1A17" },
  scroll: { flex: 1 },
  content: { paddingBottom: 24, gap: 22 },
  profile: { alignItems: "center" },
  avatar: { width: 112, height: 112, borderRadius: 56 },
  avatarFallback: { width: 112, height: 112, borderRadius: 56, backgroundColor: "#F1E7D7", alignItems: "center", justifyContent: "center" },
  profileLine: { marginTop: 12, fontFamily: "Schoolbell_400Regular", fontSize: 22, color: "#332E29", textAlign: "center" },
  detail: { marginTop: 5, fontSize: 11, color: "#82786E", textAlign: "center" },
  summary: { width: "100%", flexDirection: "row", marginTop: 18, paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#E4DDD3" },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: { fontSize: 16, fontWeight: "900", color: "#596442" },
  summaryLabel: { marginTop: 3, fontSize: 8, fontWeight: "700", color: "#8A8176", textTransform: "uppercase" },
  sectionTitle: { fontFamily: "Schoolbell_400Regular", fontSize: 27, color: "#1D1A17" },
  sectionCopy: { marginTop: -2, fontSize: 11, color: "#756B60" },
  badges: { flexDirection: "row", flexWrap: "wrap", columnGap: 4, rowGap: 12, marginTop: 12 },
  walks: { gap: 14, marginTop: 12 },
  empty: { paddingVertical: 20, color: "#82786E", textAlign: "center" },
});
