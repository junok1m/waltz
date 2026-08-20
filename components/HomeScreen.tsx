import { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import {
  ChartBar,
  Dog,
  House,
  Megaphone,
  PawPrint,
  Rss,
} from "@sketchyicons/react-native";
import { AppTab } from "./HubScreen";
import { WaltzCalendar } from "./WaltzCalendar";
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

function getHighlight(walks: Walk[], dogName: string) {
  const totalDistance = walks.reduce((sum, walk) => sum + walk.distance_km, 0);
  const streak = calculateWalkStreak(walks);

  const milestones = [1000, 500, 100];
  const unlocked = milestones.find((milestone) => totalDistance >= milestone);

  if (unlocked) {
    return `${dogName} unlocked the ${unlocked.toLocaleString()} km milestone.`;
  }

  if (streak >= 2) {
    return `${dogName} is on a ${streak}-day streak.`;
  }

  if (walks.length > 0) {
    return `${dogName}'s latest waltz is in the books.`;
  }

  return `${dogName}'s highlights will appear here.`;
}

export function HomeScreen({
  walks,
  dog,
  onStartWalk,
  onNavigate,
}: Props) {
  const [startOpen, setStartOpen] = useState(false);
  const [shareRoute, setShareRoute] = useState(false);
  const highlight = getHighlight(walks, dog.name);

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <Text style={s.logo}>waltz</Text>
      </View>

      <View style={s.highlightRow}>
        <Megaphone size={18} strokeWidth={2} color="#78845C" />
        <View style={s.highlightCopy}>
          <Text style={s.highlightLabel}>HIGHLIGHTS</Text>
          <Text style={s.highlightText}>{highlight}</Text>
        </View>
      </View>

      <WaltzCalendar walks={walks} />

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
  highlightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  highlightCopy: {
    flex: 1,
  },
  highlightLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "#78845C",
  },
  highlightText: {
    fontSize: 12,
    color: "#655D54",
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
