import { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Schoolbell_400Regular, useFonts } from "@expo-google-fonts/schoolbell";
import type { Session } from "@supabase/supabase-js";
import { AuthScreen } from "./components/AuthScreen";
import { DogOnboardingScreen } from "./components/DogOnboardingScreen";
import { HomeScreen } from "./components/HomeScreen";
import { WalkCompleteScreen } from "./components/WalkCompleteScreen";
import { WalkingScreen } from "./components/WalkingScreen";
import { useWalkTracker } from "./hooks/useWalkTracker";
import { supabase } from "./lib/supabase";
import { fetchDogsForUser } from "./services/dogs";
import { createWalk, fetchWalks } from "./services/walks";
import { Dog } from "./types/dog";
import { Walk } from "./types/walk";

export default function App() {
  const [fontsLoaded] = useFonts({ Schoolbell_400Regular });
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [dogsLoading, setDogsLoading] = useState(false);
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
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user.id) {
      setDogs([]);
      return;
    }

    loadDogs(session.user.id);
  }, [session?.user.id]);

  useEffect(() => {
    if (session) {
      loadWalks();
    }
  }, [session]);

  async function loadDogs(userId: string) {
    setDogsLoading(true);
    try {
      setDogs(await fetchDogsForUser(userId));
    } catch (error) {
      console.error("Load dogs error:", error);
    } finally {
      setDogsLoading(false);
    }
  }

  async function loadWalks() {
    try {
      setWalks(await fetchWalks());
    } catch (error) {
      console.error("Load walks error:", error);
    }
  }

  async function saveWalk() {
    const activeDog = dogs[0];
    if (!activeDog) {
      Alert.alert("No dog selected", "Add a walking buddy first.");
      return;
    }

    try {
      await createWalk({
        dogName: activeDog.name,
        distanceKm: distance,
        durationSeconds: seconds,
      });

      await loadWalks();
      Alert.alert("Saved!", `${activeDog.name} walked ${distance.toFixed(2)} km 🐕`);
      resetWalk();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(error);
      Alert.alert("Save failed", message);
    }
  }

  if (!fontsLoaded || !authReady) {
    return <View style={styles.container} />;
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <AuthScreen />
        <StatusBar style="dark" />
      </View>
    );
  }

  if (dogsLoading) {
    return <View style={styles.container} />;
  }

  if (dogs.length === 0) {
    return (
      <View style={styles.container}>
        <DogOnboardingScreen
          userId={session.user.id}
          onCreated={() => loadDogs(session.user.id)}
        />
        <StatusBar style="dark" />
      </View>
    );
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
    paddingTop: 68,
    paddingBottom: 8,
  },
});
