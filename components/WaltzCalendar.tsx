import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MapPin, PawPrint } from "@sketchyicons/react-native";
import { Walk } from "../types/walk";
import { formatTime } from "../utils/time";

type Props = {
  walks: Walk[];
};

export function WaltzCalendar({ walks }: Props) {
  const now = new Date();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const monthWalks = walks.filter((walk) => {
    const date = new Date(walk.ended_at);
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
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
    now.getFullYear(),
    now.getMonth(),
    1,
  ).getDay();

  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();

  const cells: Array<number | null> = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const month = new Intl.DateTimeFormat("en-AU", {
    month: "long",
    year: "numeric",
  }).format(now);

  return (
    <View style={s.container}>
      <Text style={s.month}>{month}</Text>

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
            {month.split(" ")[0]} {selectedDay}
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

      <View style={s.stats}>
        <View style={s.statItem}>
          <PawPrint size={20} strokeWidth={2} color="#78845C" />
          <View>
            <Text style={s.muted}>Total walks</Text>
            <Text style={s.value}>{monthWalks.length}</Text>
          </View>
        </View>

        <View style={s.statItem}>
          <MapPin size={20} strokeWidth={2} color="#78845C" />
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
    paddingVertical: 12,
  },
  month: {
    textAlign: "center",
    fontSize: 21,
    fontWeight: "700",
    marginBottom: 8,
    color: "#2B251F",
  },
  week: {
    flexDirection: "row",
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
    height: 34,
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
    marginTop: 2,
  },
  dayDetail: {
    marginTop: 8,
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
  stats: {
    borderTopWidth: 1,
    borderTopColor: "#EEE5D7",
    marginTop: 7,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  muted: {
    fontSize: 11,
    color: "#756B60",
    marginTop: 3,
  },
  value: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1D1A17",
    marginTop: 2,
  },
});
