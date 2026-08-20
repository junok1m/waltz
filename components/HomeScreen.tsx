import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import {
  ChartBar,
  Dog,
  Flame,
  House,
  Medal,
  Megaphone,
  PawPrint,
  Rss,
  Trophy,
} from "@sketchyicons/react-native";
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
  onStartWalk: (shareRoute: boolean) => void;
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
      return `${dogName} received a boop.`;
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
  }
}

export function HomeScreen({
  walks,
  dog,
  onStartWalk,
  onNavigate,
}: Props) {
  const [startOpen, setStartOpen] = useState(false);
  const [shareRoute, setShareRoute] = useState(false);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const streak = calculateWalkStreak(walks);
  const completedChallenges = earnedBadgeIds(walks).length;

  useEffect(() => {
    let active = true;

    fetchLatestActivityEvents(dog.id, 3)
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
      </View>

      <ScrollView
        style={s.content}
        contentContainerStyle={s.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <HighlightRow
          icon={<Megaphone size={18} strokeWidth={2} color="#78845C" />}
          label="HIGHLIGHTS"
          text={
            activities.length
              ? activities.map((event) => eventText(event, dog.name))
              : `${dog.name}'s latest events will appear here.`
          }
        />

        <WaltzCalendar walks={walks} />

        <View style={s.summaryRows}>
          <HighlightRow
            icon={<Flame size={18} strokeWidth={2} color="#E87859" />}
            label="STREAK"
            text={`${streak} day${streak === 1 ? "" : "s"} in a row`}
          />
          <HighlightRow
            icon={<Medal size={18} strokeWidth={2} color="#78845C" />}
            label="CHALLENGES"
            text={`${completedChallenges} completed · See all challenges`}
            onPress={() => onNavigate("challenges")}
          />
          <HighlightRow
            icon={<Trophy size={18} strokeWidth={2} color="#78845C" />}
            label="LEADERBOARD"
            text={`See where ${dog.name} ranks`}
            onPress={() => onNavigate("leaderboard")}
          />
        </View>
      </ScrollView>

      <View style={s.nav}>
        <Nav
          icon={<House size={22} strokeWidth={2} color="#78845C" />}
          label="Home"
          active
          onPress={() => onNavigate("home")}
        />
        <Nav
          icon={<ChartBar size={22} strokeWidth={2} color="#332E29" />}
          label="Report"
          onPress={() => onNavigate("map")}
        />
        <Pressable style={s.pawButton} onPress={() => setStartOpen(true)}>
          <PawPrint size={27} strokeWidth={2} color="#FFFDF8" />
        </Pressable>
        <Nav
          icon={<Rss size={22} strokeWidth={2} color="#332E29" />}
          label="Feed"
          onPress={() => onNavigate("community")}
        />
        <Nav
          icon={<Dog size={22} strokeWidth={2} color="#332E29" />}
          label="Me"
          onPress={() => onNavigate("me")}
        />
      </View>

      <Modal
        visible={startOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setStartOpen(false)}
      >
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetTitleRow}>
              <PawPrint size={27} strokeWidth={2} color="#1D1A17" />
              <Text style={s.sheetTitle}>Ready for a waltz?</Text>
            </View>

            <View style={s.shareRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.shareTitle}>Share this route</Text>
                <Text style={s.shareCopy}>
                  Friends can see the route after you save the walk. Your live
                  location is never shared.
                </Text>
              </View>
              <Switch value={shareRoute} onValueChange={setShareRoute} />
            </View>

            <Pressable
              style={s.start}
              onPress={() => {
                setStartOpen(false);
                onStartWalk(shareRoute);
              }}
            >
              <View style={s.startContent}>
                <PawPrint size={27} strokeWidth={2} color="#FFFDF8" />
                <Text style={s.startText}>START WALK</Text>
              </View>
            </Pressable>

            <Pressable onPress={() => setStartOpen(false)}>
              <Text style={s.cancel}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Nav({
  icon,
  label,
  active,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={s.navItem} onPress={onPress}>
      {icon}
      <Text style={[s.navLabel, active && s.active]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginBottom: 10,
  },
  logo: {
    fontFamily: "Schoolbell_400Regular",
    fontSize: 34,
    color: "#1D1A17",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 12,
  },
  summaryRows: {
    marginTop: 2,
  },
  start: {
    backgroundColor: "#8C9670",
    borderRadius: 22,
    paddingVertical: 15,
    alignItems: "center",
  },
  startContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  startText: {
    fontFamily: "Schoolbell_400Regular",
    color: "#FFFDF8",
    fontSize: 25,
    letterSpacing: 1.3,
  },
  nav: {
    height: 68,
    borderRadius: 25,
    backgroundColor: "#FFFDF8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  navItem: {
    width: 58,
    alignItems: "center",
  },
  navLabel: {
    fontSize: 9,
    color: "#443D37",
    marginTop: 2,
  },
  active: {
    color: "#78845C",
    fontWeight: "800",
  },
  pawButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#89936B",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -20,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.28)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFDF8",
    padding: 24,
    paddingBottom: 38,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    gap: 18,
  },
  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sheetTitle: {
    fontFamily: "Schoolbell_400Regular",
    fontSize: 30,
  },
  shareRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  shareTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  shareCopy: {
    fontSize: 12,
    color: "#756B60",
    marginTop: 4,
    lineHeight: 17,
  },
  cancel: {
    textAlign: "center",
    fontWeight: "700",
    color: "#756B60",
  },
});
