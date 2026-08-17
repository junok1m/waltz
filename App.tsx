import { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { HomeScreen } from "./components/HomeScreen";
import { WalkCompleteScreen } from "./components/WalkCompleteScreen";
import { WalkingScreen } from "./components/WalkingScreen";
import { useWalkTracker } from "./hooks/useWalkTracker";
import { createWalk, fetchWalks } from "./services/walks";
import { Walk } from "./types/walk";

export default function App() {
  const [walks, setWalks] = useState<Walk[]>([]);
  const {
    isWalking,
    walkFinished,
    seconds,
    distance,
    startWalk,
    stopWalk,
    resetWalk,
  } = useWalkTracker();

  useEffect(() => {
    loadWalks();
  }, []);

  async function loadWalks() {
    try {
      setWalks(await fetchWalks());
    } catch (error) {
      console.error("Load walks error:", error);
    }
  }

  async function saveWalk() {
    try {
      await createWalk({
        dogName: "Janggo",
        distanceKm: distance,
        durationSeconds: seconds,
      });

      await loadWalks();
      Alert.alert("Saved!", `Janggo walked ${distance.toFixed(2)} km 🐕`);
      resetWalk();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(error);
      Alert.alert("Save failed", message);
    }
  }

  return (
    <View style={styles.container}>
      {walkFinished ? (
        <WalkCompleteScreen
          seconds={seconds}
          distance={distance}
          onSave={saveWalk}
          onDiscard={resetWalk}
        />
      ) : isWalking ? (
        <WalkingScreen
          seconds={seconds}
          distance={distance}
          onStopWalk={stopWalk}
        />
      ) : (
        <HomeScreen walks={walks} onStartWalk={startWalk} />
      )}

      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F3E9",
    paddingHorizontal: 18,
    paddingTop: 54,
  },
});
