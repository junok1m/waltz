import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import { supabase } from "./lib/supabase";

type Point = {
  latitude: number;
  longitude: number;
};
type Walk = {
  id: number;
  dog_name: string;
  distance_km: number;
  duration_seconds: number;
  ended_at: string;
};
function getDistanceInKm(a: Point, b: Point) {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;

  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const y = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

  return R * y;
}

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [hours, minutes, secs]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export default function App() {
  const [isWalking, setIsWalking] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [distance, setDistance] = useState(0);
  const [walkFinished, setWalkFinished] = useState(false);
  const [walks, setWalks] = useState<Walk[]>([]);

  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null
  );

  const previousPoint = useRef<Point | null>(null);
  // ① 산책 중 타이머 돌리는 놈

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;

    if (isWalking) {
      timer = setInterval(() => {
        setSeconds((current) => current + 1);
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isWalking]);
  // ② 앱 처음 켰을 때 Supabase에서 산책 기록 가져오는 놈

  useEffect(() => {
    loadWalks();
  }, []);

  async function startWalk() {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Location needed",
        "Waltz needs your location to record walks."
      );
      return;
    }

    setSeconds(0);
    setDistance(0);
    previousPoint.current = null;
    setIsWalking(true);

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 2000,
        distanceInterval: 3,
      },
      (location) => {
        const currentPoint = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        if (previousPoint.current) {
          const newDistance = getDistanceInKm(
            previousPoint.current,
            currentPoint
          );

          setDistance((current) => current + newDistance);
        }

        previousPoint.current = currentPoint;
      }
    );
  }

  function stopWalk() {
    locationSubscription.current?.remove();
    locationSubscription.current = null;
    previousPoint.current = null;

    setIsWalking(false);
    setWalkFinished(true);
  }
  async function saveWalk() {
    const { error } = await supabase.from("walks").insert({
      dog_name: "Janggo",
      distance_km: distance,
      duration_seconds: seconds,
      ended_at: new Date().toISOString(),
    });

    if (error) {
      console.error(error);

      Alert.alert("Save failed", error.message);

      return;
    }

    Alert.alert("Saved!", `Janggo walked ${distance.toFixed(2)} km 🐕`);
    await loadWalks();
    setWalkFinished(false);
    setSeconds(0);
    setDistance(0);
  }

  async function loadWalks() {
    const { data, error } = await supabase
      .from("walks")
      .select("*")
      .order("ended_at", { ascending: false });

    if (error) {
      console.error("Load walks error:", error);
      return;
    }

    setWalks(data ?? []);
  }

  const totalDistance = walks.reduce(
    (sum, walk) => sum + walk.distance_km,
    0
  );

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>waltz</Text>

      <Text style={styles.dog}>🐕〰️</Text>

      <Text style={styles.name}>Janggo</Text>

      {walkFinished ? (
        <>
          <Text style={styles.complete}>Walk complete! 🎉</Text>

          <Text style={styles.resultDistance}>{distance.toFixed(2)} km</Text>

          <Text style={styles.resultTime}>{formatTime(seconds)}</Text>

          <Text style={styles.firstWalk}>Janggo did a waltz 🐕</Text>

          <Pressable style={styles.button} onPress={saveWalk}>
            <Text style={styles.buttonText}>SAVE WALK</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setWalkFinished(false);
              setSeconds(0);
              setDistance(0);
            }}
          >
            <Text style={styles.discard}>Discard</Text>
          </Pressable>
        </>
      ) : !isWalking ? (
        <>
          <Text style={styles.streak}>🔥 0 day streak</Text>
<Text style={styles.stats}>
  🐾 {walks.length} walks · {totalDistance.toFixed(2)} km
</Text>

{walks.length > 0 && (
  <View style={styles.recent}>
    <Text style={styles.recentTitle}>Recent walk</Text>

    <Text style={styles.recentWalk}>
      {walks[0].distance_km.toFixed(2)} km ·{' '}
      {Math.round(walks[0].duration_seconds / 60)} min
    </Text>
  </View>
)}
          <Pressable style={styles.button} onPress={startWalk}>
            <Text style={styles.buttonText}>START WALK</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.walking}>Janggo is walking...</Text>

          <Text style={styles.timer}>{formatTime(seconds)}</Text>

          <Text style={styles.distance}>{distance.toFixed(2)} km</Text>

          <Text style={styles.gps}>📍 GPS tracking</Text>

          <Pressable style={styles.stopButton} onPress={stopWalk}>
            <Text style={styles.buttonText}>STOP WALK</Text>
          </Pressable>
        </>
      )}

      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  stats: {
    fontSize: 17,
    marginBottom: 24,
  },
  
  recent: {
    alignItems: 'center',
    marginBottom: 30,
  },
  
  recentTitle: {
    fontSize: 14,
    opacity: 0.5,
    marginBottom: 6,
  },
  
  recentWalk: {
    fontSize: 18,
    fontWeight: '600',
  },
  
  complete: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 20,
  },

  resultDistance: {
    fontSize: 52,
    fontWeight: "700",
  },

  resultTime: {
    fontSize: 24,
    marginTop: 4,
    marginBottom: 24,
  },

  firstWalk: {
    fontSize: 18,
    marginBottom: 36,
  },

  discard: {
    fontSize: 16,
    marginTop: 20,
    textDecorationLine: "underline",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  logo: {
    fontSize: 48,
    fontWeight: "700",
    marginBottom: 24,
  },

  dog: {
    fontSize: 64,
    marginBottom: 24,
  },

  name: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 8,
  },

  streak: {
    fontSize: 18,
    marginBottom: 40,
  },

  walking: {
    fontSize: 20,
    marginBottom: 20,
  },

  timer: {
    fontSize: 46,
    fontWeight: "700",
    marginBottom: 8,
  },

  distance: {
    fontSize: 30,
    fontWeight: "600",
    marginBottom: 8,
  },

  gps: {
    fontSize: 16,
    marginBottom: 36,
  },

  button: {
    backgroundColor: "#111",
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 999,
  },

  stopButton: {
    backgroundColor: "#111",
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 999,
  },

  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
