import { useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ArrowLeft, Bone, Dog as DogIcon, Footprints, Ruler } from "@sketchyicons/react-native";
import type { AppTab } from "./HubScreen";
import type { Dog } from "../types/dog";
import type { PublicDogProfile } from "../services/publicProfile";
import { fetchPublicDogProfile } from "../services/publicProfile";
import { setWalkBoop } from "../services/boops";
import { dogAvatarSource } from "../utils/mockDogAvatars";
import { BadgeIcon } from "./BadgeIcon";
import { BottomNav } from "./BottomNav";
import { MeBadgeActivityCard, MeWalkActivityCard } from "./MeActivityCards";
import { WobblyCard, WobblyDivider } from "./WobblyCard";
import { WaltzErrorScreen } from "./WaltzErrorScreen";
import { WaltzLoadingScreen } from "./WaltzLoadingScreen";

type Props = {
  dogId: string;
  viewerDog: Dog;
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

type TimelineItem =
  | { kind: "walk"; date: string; walk: PublicDogProfile["walks"][number] }
  | { kind: "badge"; date: string; badge: PublicDogProfile["badges"][number] };

export function PublicDogProfileScreen({ dogId, viewerDog, onBack, onNavigate, onStartWalk }: Props) {
  const [profile, setProfile] = useState<PublicDogProfile | null>(null);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [boopCounts, setBoopCounts] = useState<Record<number, number>>({});
  const [boopedWalkIds, setBoopedWalkIds] = useState<Set<number>>(new Set());
  const [busyWalkIds, setBusyWalkIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let active = true;
    setProfile(null);
    setError(false);
    fetchPublicDogProfile(dogId, viewerDog.id)
      .then((value) => {
        if (!active) return;
        setProfile(value);
        setBoopCounts(value.boopCounts);
        setBoopedWalkIds(new Set(value.boopedWalkIds));
      })
      .catch((reason) => {
        console.error("Load public dog profile error:", reason);
        if (active) setError(true);
      });
    return () => { active = false; };
  }, [dogId, retryKey, viewerDog.id]);

  const totals = useMemo(() => {
    if (!profile) return { distance: 0, boops: 0 };
    return {
      distance: profile.totalDistance,
      boops: Object.values(boopCounts).reduce((sum, count) => sum + count, 0),
    };
  }, [boopCounts, profile]);

  async function toggleBoop(walkId: number) {
    if (!profile || busyWalkIds.has(walkId) || profile.dog.owner_id === viewerDog.owner_id) return;
    const wasBooped = boopedWalkIds.has(walkId);
    setBusyWalkIds((current) => new Set(current).add(walkId));
    setBoopedWalkIds((current) => {
      const next = new Set(current);
      wasBooped ? next.delete(walkId) : next.add(walkId);
      return next;
    });
    setBoopCounts((current) => ({ ...current, [walkId]: Math.max(0, (current[walkId] ?? 0) + (wasBooped ? -1 : 1)) }));
    try {
      await setWalkBoop({ fromDogId: viewerDog.id, toDogId: profile.dog.id, walkId, booped: wasBooped });
    } catch (reason) {
      setBoopedWalkIds((current) => {
        const next = new Set(current);
        wasBooped ? next.add(walkId) : next.delete(walkId);
        return next;
      });
      setBoopCounts((current) => ({ ...current, [walkId]: Math.max(0, (current[walkId] ?? 0) + (wasBooped ? 1 : -1)) }));
      Alert.alert("Boop failed", reason instanceof Error ? reason.message : "Could not save this Boop");
    } finally {
      setBusyWalkIds((current) => {
        const next = new Set(current);
        next.delete(walkId);
        return next;
      });
    }
  }

  if (error) return <WaltzErrorScreen title="Lost this trail" copy="Waltz couldn't load this dog's public profile." onRetry={() => setRetryKey((value) => value + 1)} />;
  if (!profile) return <WaltzLoadingScreen />;

  const { dog, walks, badges } = profile;
  const avatarSource = dogAvatarSource(dog.id, dog.avatar_url);
  const timeline: TimelineItem[] = [
    ...walks.map((walk) => ({ kind: "walk" as const, date: walk.ended_at, walk })),
    ...badges.map((badge) => ({ kind: "badge" as const, date: badge.earned_at, badge })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onBack} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back to feed">
          <ArrowLeft size={22} strokeWidth={2} color="#78845C" />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <WobblyCard contentStyle={styles.profile}>
          {avatarSource
            ? <Image source={avatarSource} style={styles.avatar} />
            : <View style={styles.avatarFallback}><DogIcon size={48} strokeWidth={1.8} color="#78845C" /></View>}
          <Text style={styles.profileName}>{dog.name}</Text>
          <Text style={styles.profileDetail}>{[dog.breed, ageLabel(profile)].filter(Boolean).join(" · ")}</Text>
          <Text style={styles.profileLine}>{dog.profile_line || "Very good dog"}</Text>
          <WobblyDivider style={styles.summaryDivider} />
          <View style={styles.summary}>
            <ProfileStat icon={<Footprints size={20} strokeWidth={2} color="#78845C" />} value={String(profile.totalWaltzes)} />
            <ProfileStat icon={<Ruler size={20} strokeWidth={2} color="#78845C" />} value={`${totals.distance.toFixed(1)} km`} />
            <ProfileStat icon={<Bone size={20} strokeWidth={2} color="#78845C" />} value={String(totals.boops)} />
          </View>
        </WobblyCard>

        {badges.length ? (
          <View>
            <Text style={styles.sectionTitle}>Stamps</Text>
            <View style={styles.badges}>{badges.map((badge) => <BadgeIcon key={badge.id} badgeId={badge.badge_id} size={48} labelLines={2} />)}</View>
          </View>
        ) : null}

        <View>
          <Text style={styles.sectionTitle}>Recent activity</Text>
          <View style={styles.walks}>
            {timeline.length
              ? timeline.slice(0, 8).map((item) => item.kind === "walk"
                ? <MeWalkActivityCard
                    key={`walk-${item.walk.id}`}
                    walk={item.walk}
                    wobbly
                    boopCount={boopCounts[item.walk.id] ?? 0}
                    booped={boopedWalkIds.has(item.walk.id)}
                    boopBusy={busyWalkIds.has(item.walk.id)}
                    onBoop={dog.owner_id === viewerDog.owner_id ? undefined : () => toggleBoop(item.walk.id)}
                  />
                : <MeBadgeActivityCard key={`badge-${item.badge.id}`} dogName={dog.name} badge={item.badge} wobbly />)
              : <Text style={styles.empty}>No public activity yet.</Text>}
          </View>
        </View>
      </ScrollView>

      <BottomNav active="community" onNavigate={onNavigate} onStartPress={onStartWalk} />
    </View>
  );
}

function ProfileStat({ icon, value }: { icon: React.ReactNode; value: string }) {
  return <View style={styles.summaryItem}>{icon}<Text style={styles.summaryValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "space-between" },
  header: { minHeight: 42, flexDirection: "row", alignItems: "center", marginBottom: 14 },
  backButton: { paddingVertical: 8, paddingRight: 12 },
  scroll: { flex: 1 },
  content: { paddingBottom: 24, gap: 22 },
  profile: { alignItems: "center", paddingVertical: 22 },
  avatar: { width: 112, height: 112, borderRadius: 56 },
  avatarFallback: { width: 112, height: 112, borderRadius: 56, backgroundColor: "#F1E7D7", alignItems: "center", justifyContent: "center" },
  profileName: { marginTop: 10, fontFamily: "Schoolbell_400Regular", fontSize: 30, color: "#1D1A17" },
  profileDetail: { marginTop: -2, fontSize: 11, color: "#82786E" },
  profileLine: { marginTop: 10, fontFamily: "Schoolbell_400Regular", fontSize: 22, color: "#332E29", textAlign: "center" },
  summaryDivider: { width: "100%", marginTop: 18 },
  summary: { width: "100%", flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingTop: 12 },
  summaryItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  summaryValue: { fontSize: 14, fontWeight: "800", color: "#596442" },
  sectionTitle: { fontFamily: "Schoolbell_400Regular", fontSize: 27, color: "#1D1A17" },
  badges: { flexDirection: "row", flexWrap: "wrap", columnGap: 4, rowGap: 12, marginTop: 12 },
  walks: { gap: 14, marginTop: 12 },
  empty: { paddingVertical: 20, color: "#82786E", textAlign: "center" },
});
