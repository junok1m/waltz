import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Dog,
  Flame,
  Medal,
  Megaphone,
  Trophy,
} from "@sketchyicons/react-native";
import { BottomNav } from "./BottomNav";
import { HighlightRow } from "./HighlightRow";
import { AppTab } from "./HubScreen";
import { WaltzCalendar } from "./WaltzCalendar";
import { fetchLatestActivityEvents } from "../services/activity";
import { earnedBadgeIds } from "../services/badges";
import { ActivityEvent } from "../types/activity";
import { Walk } from "../types/walk";
import { Dog as DogType } from "../types/dog";
import { calculateWalkStreak } from "../utils/streak";

type Props = {
  walks: Walk[];
  dog: DogType;
  onStartWalk: () => void;
  onNavigate: (tab: AppTab) => void;
  onOpenDogs: () => void;
};

function eventText(event: ActivityEvent, dogName: string) {
  const metadata = event.metadata ?? {};
  const stringValue = (key: string) =>
    typeof metadata[key] === "string" ? metadata[key] : null;
  const numberValue = (key: string) =>
    typeof metadata[key] === "number" ? metadata[key] : null;

  switch (event.event_type) {
    case "boop_received":
      return `${event.actor_name ?? "A friend"} booped ${dogName}.`;
    case "badge_earned":
      return `${dogName} earned the ${(event.badge_id ?? "new").replaceAll("-", " ")} badge.`;
    case "shared_walk": {
      const title = stringValue("title") ?? "A waltz";
      const distance = numberValue("distance_km");
      return distance === null
        ? `${dogName} shared “${title}”.`
        : `${dogName} shared “${title}” · ${distance.toFixed(2)} km.`;
    }
    case "area_unlocked":
      return `${dogName} unlocked ${stringValue("area_name") ?? "a new area"}.`;
    case "local_legend":
      return `${dogName} became Local Legend of ${stringValue("segment_name") ?? "a new segment"}.`;
    case "challenge_complete":
      return `${dogName} completed ${stringValue("challenge_name") ?? "a challenge"}.`;
    case "ranking_climbed": {
      const rank = numberValue("new_rank");
      const category = stringValue("category");
      const league = category === "waltzes" ? "Most Waltzes" : category === "places" ? "New Places" : "Distance";
      return rank === 1
        ? `${dogName} took 1st place in ${league}!`
        : `${dogName} climbed to #${rank ?? "?"} in ${league}!`;
    }
    case "places_discovered": {
      const count = numberValue("place_count") ?? 1;
      return `${dogName} discovered ${count} new ${count === 1 ? "place" : "places"}.`;
    }
  }
}

export function HomeScreen({
  walks,
  dog,
  onStartWalk,
  onNavigate,
  onOpenDogs,
}: Props) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const streak = calculateWalkStreak(walks);
  const completedAchievements = earnedBadgeIds(walks).length;

  useEffect(() => {
    let active = true;

    fetchLatestActivityEvents(dog.id, 1)
      .then((events) => {
        if (active) setActivities(events);
      })
      .catch((error) => {
        console.error("Load home highlights error:", error);
        if (active) setActivities([]);
      });

    return () => {
      active = false;
    };
  }, [dog.id]);

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <Text style={s.logo}>waltz</Text>
        <Pressable
          style={s.dogSwitcher}
          onPress={onOpenDogs}
          accessibilityRole="button"
          accessibilityLabel={`Switch dog. Currently ${dog.name}`}
        >
          <Dog size={15} strokeWidth={2} color="#78845C" />
          <Text style={s.dogSwitcherName}>{dog.name}</Text>
          <Text style={s.dogSwitcherChevron}>⌄</Text>
        </Pressable>
      </View>

      <ScrollView
        style={s.content}
        contentContainerStyle={s.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.highlightBlock}>
          <HighlightRow
          icon={<Megaphone size={18} strokeWidth={2} color="#78845C" />}
          label="HIGHLIGHTS"
          showDivider={false}
          text={
            activities.length
              ? eventText(activities[0], dog.name)
              : `${dog.name}'s latest events will appear here.`
          }
          />
        </View>

        <WaltzCalendar walks={walks} />

        <View style={s.summaryRows}>
          <HighlightRow
            icon={<Flame size={18} strokeWidth={2} color="#E87859" />}
            label="STREAK"
            text={`${streak} day${streak === 1 ? "" : "s"} in a row`}
          />
          <HighlightRow
            icon={<Medal size={18} strokeWidth={2} color="#78845C" />}
            label="ACHIEVEMENTS"
            text={`${completedAchievements} completed · See this month\'s achievements`}
            onPress={() => onNavigate("achievements")}
          />
          <HighlightRow
            icon={<Trophy size={18} strokeWidth={2} color="#78845C" />}
            label="RANKING"
            text={`See where ${dog.name} ranks`}
            onPress={() => onNavigate("leaderboard")}
          />
        </View>
      </ScrollView>

      <BottomNav active="home" onNavigate={onNavigate} onStartPress={onStartWalk} />
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 42,
    marginBottom: 14,
  },
  logo: {
    fontFamily: "Schoolbell_400Regular",
    fontSize: 34,
    color: "#1D1A17",
  },
  dogSwitcher: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#DDD8CF",
    borderRadius: 999,
  },
  dogSwitcherName: {
    fontSize: 11,
    fontWeight: "800",
    color: "#655D54",
  },
  dogSwitcherChevron: {
    fontSize: 12,
    color: "#82786E",
    marginTop: -2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 12,
  },
  highlightBlock: {
    marginBottom: 18,
  },
  summaryRows: {
    marginTop: 20,
  },
});
