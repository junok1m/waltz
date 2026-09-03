import { Image, StyleSheet, Text, View } from "react-native";
import { Bone, Dog as DogIcon, Footprints, Ruler } from "@sketchyicons/react-native";
import type { Dog } from "../types/dog";
import { dogAvatarSource } from "../utils/mockDogAvatars";
import { WobblyCard, WobblyDivider } from "./WobblyCard";

type Props = {
  dog: Dog;
  totalWaltzes: number;
  totalDistance: number;
  totalBoops: number;
};

function ageLabel(dog: Dog) {
  const now = new Date();
  let age = now.getFullYear() - dog.birth_year;
  const month = (dog.birth_month ?? 1) - 1;
  const day = dog.birth_day ?? 1;
  if (now.getMonth() < month || (now.getMonth() === month && now.getDate() < day)) age -= 1;
  return `${Math.max(0, age)} year${age === 1 ? "" : "s"} old`;
}

export function DogProfileHero({ dog, totalWaltzes, totalDistance, totalBoops }: Props) {
  const avatarSource = dogAvatarSource(dog.id, dog.avatar_url);

  return (
    <WobblyCard contentStyle={styles.profile}>
      <View style={styles.profileTop}>
        <View style={styles.identity}>
          <Text style={styles.profileName}>{dog.name}</Text>
          <Text style={styles.profileDetail}>{[dog.breed, ageLabel(dog)].filter(Boolean).join(" · ")}</Text>
        </View>
        {avatarSource
          ? <Image source={avatarSource} style={styles.avatar} />
          : <View style={styles.avatarFallback}><DogIcon size={42} strokeWidth={1.8} color="#78845C" /></View>}
      </View>
      <Text style={styles.profileLine}>{dog.profile_line || "Very good dog"}</Text>
      <WobblyDivider style={styles.summaryDivider} />
      <View style={styles.summary}>
        <ProfileStat icon={<Footprints size={20} strokeWidth={2} color="#78845C" />} value={String(totalWaltzes)} />
        <ProfileStat icon={<Ruler size={20} strokeWidth={2} color="#78845C" />} value={`${totalDistance.toFixed(1)} km`} />
        <ProfileStat icon={<Bone size={20} strokeWidth={2} color="#78845C" />} value={String(totalBoops)} />
      </View>
    </WobblyCard>
  );
}

function ProfileStat({ icon, value }: { icon: React.ReactNode; value: string }) {
  return <View style={styles.summaryItem}>{icon}<Text style={styles.summaryValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  profile: { paddingHorizontal: 22, paddingVertical: 20 },
  profileTop: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 18 },
  identity: { flex: 1, alignSelf: "stretch", justifyContent: "center" },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarFallback: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#F1E7D7", alignItems: "center", justifyContent: "center" },
  profileName: { fontFamily: "Schoolbell_400Regular", fontSize: 32, color: "#1D1A17" },
  profileDetail: { marginTop: 1, fontSize: 11, color: "#82786E", lineHeight: 16 },
  profileLine: { marginTop: 16, fontFamily: "Schoolbell_400Regular", fontSize: 21, color: "#332E29", textAlign: "left" },
  summaryDivider: { width: "100%", marginTop: 18 },
  summary: { width: "100%", flexDirection: "row", justifyContent: "flex-start", alignItems: "center", gap: 28, paddingTop: 12 },
  summaryItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  summaryValue: { fontSize: 14, fontWeight: "800", color: "#596442" },
});
