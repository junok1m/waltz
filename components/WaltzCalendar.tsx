import { useRef, useState } from "react";
import { PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import { Flame, MapPin, PawPrint } from "@sketchyicons/react-native";
import { Walk } from "../types/walk";
import { calculateWalkStreak } from "../utils/streak";
import { formatTime } from "../utils/time";

type Props = {
  walks: Walk[];
};

export function WaltzCalendar({ walks }: Props) {
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [displayedMonth, setDisplayedMonth] = useState(currentMonth);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const streak = calculateWalkStreak(walks);

  const moveMonth = (delta: number) => {
    setDisplayedMonth((previous) => {
      const next = new Date(
        previous.getFullYear(),
        previous.getMonth() + delta,
        1,
      );

      if (next.getTime() > currentMonth.getTime()) {
        return currentMonth;
      }

      return next;
    });
    setSelectedDay(null);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 18 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 45) {
          moveMonth(-1);
        } else if (gesture.dx < -45) {
          moveMonth(1);
        }
      },
    }),
  ).current;

  const monthWalks = walks.filter((walk) => {
    const date = new Date(walk.ended_at);
    return (
      date.getMonth() === displayedMonth.getMonth() &&
      date.getFullYear() === displayedMonth.getFullYear()
    );
  });

  const distance = monthWalks.reduce(
    (sum, walk) => sum + walk.distance_km,
    0,
  );

  const activeDays = new Set(
    monthWalks.map((walk) => new Date(walk.ended_at).getDate()),
  );

  const selectedWalks = selectedDay
    ? monthWalks.filter(
        (walk) => new Date(walk.ended_at).getDate() === selectedDay,
      )
    : [];

  const selectedDistance = selectedWalks.reduce(
    (sum, walk) => sum + walk.distance_km,
    0,
  );

  const selectedSeconds = selectedWalks.reduce(
    (sum, walk) => sum + walk.duration_seconds,
    0,
  );

  const firstWeekday = new Date(
    displayedMonth.getFullYear(),
    displayedMonth.getMonth(),
    1,
  ).getDay();

  const daysInMonth = new Date(
    displayedMonth.getFullYear(),
    displayedMonth.getMonth() + 1,
    0,
  ).getDate();

  const cells: Array<number | null> = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const monthName = new Intl.DateTimeFormat("en-AU", {
    month: "long",
  }).format(displayedMonth);
  const year = displayedMonth.getFullYear();

  return (
    <View style={s.container} {...panResponder.panHandlers}>
      <View style={s.monthRow}>
        <Text style={s.month}>{monthName}</Text>
        <Text style={s.year}>{year}</Text>
      </View>

      <View style={s.week}>
        {["S", "M", "T", "W", "T", "F", "S"].map((label, index) => (
          <Text key={index} style={s.weekText}>
            {label}
          </Text>
        ))}
      </View>

      <View style={s.calendar}>
        {cells.map((day, index) => (
          <Pressable
            disabled={day === null}
            onPress={() => day !== null && setSelectedDay(day)}
            key={index}
            style={[
              s.day,
              day !== null && day === selectedDay && s.selectedDay,
            ]}
          >
            <Text style={s.dayText}>{day ?? ""}</Text>
            {day !== null && activeDays.has(day) ? <View style={s.walkDot} /> : null}
          </Pressable>
        ))}
      </View>

      {selectedDay ? (
        <View style={s.dayDetail}>
          <Text style={s.dayTitle}>
            {monthName} {selectedDay}
          </Text>
          {selectedWalks.length ? (
            <Text style={s.dayCopy}>
              {selectedWalks.length} walk
              {selectedWalks.length === 1 ? "" : "s"} ·{" "}
              {selectedDistance.toFixed(2)} km · {formatTime(selectedSeconds)}
            </Text>
          ) : (
            <Text style={s.dayCopy}>No walks yet.</Text>
          )}
        </View>
      ) : null}

      <View style={s.streakLine}>
        <Flame size={17} strokeWidth={2} color="#E87859" />
        <Text style={s.streakText}>
          {streak} day{streak === 1 ? "" : "s"} streak
        </Text>
      </View>

      <View style={s.stats}>
        <View style={s.statItem}>
          <PawPrint size={18} strokeWidth={2} color="#78845C" />
          <View>
            <Text style={s.muted}>Total walks</Text>
            <Text style={s.value}>{monthWalks.length}</Text>
          </View>
        </View>

        <View style={s.statItem}>
          <MapPin size={18} strokeWidth={2} color="#78845C" />
          <View>
            <Text style={s.muted}>Total distance</Text>
            <Text style={s.value}>{distance.toFixed(1)} km</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  month: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2B251F",
  },
  year: {
    fontSize: 18,
    color: "#756B60",
  },
  week: {
    flexDirection: "row",
    marginBottom: 10,
  },
  weekText: {
    width: "14.2857%",
    textAlign: "center",
    fontSize: 11,
    color: "#756B60",
  },
  calendar: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  day: {
    width: "14.2857%",
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedDay: {
    backgroundColor: "#E9E4D7",
  },
  dayText: {
    fontSize: 13,
    color: "#2D2823",
  },
  walkDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#78845C",
    marginTop: 3,
  },
  dayDetail: {
    marginTop: 10,
    paddingVertical: 10,
  },
  dayTitle: {
    fontWeight: "800",
    fontSize: 13,
  },
  dayCopy: {
    fontSize: 12,
    color: "#655D54",
    marginTop: 2,
  },
  streakLine: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 18,
  },
  streakText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#655D54",
  },
  stats: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 120,
  },
  muted: {
    fontSize: 10,
    color: "#756B60",
  },
  value: {
    fontSize: 19,
    fontWeight: "800",
    color: "#1D1A17",
    marginTop: 2,
  },
});
