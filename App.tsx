import { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Schoolbell_400Regular, useFonts } from "@expo-google-fonts/schoolbell";
import type { Session } from "@supabase/supabase-js";
import { AppRouter } from "./components/AppRouter";
import { AuthScreen } from "./components/AuthScreen";
import { DogOnboardingScreen } from "./components/DogOnboardingScreen";
import { AppTab } from "./components/HubScreen";
import { defaultWalkTitle } from "./components/WalkCompleteScreen";
import { useWaltzData } from "./hooks/useWaltzData";
import { useWalkTracker } from "./hooks/useWalkTracker";
import { supabase } from "./lib/supabase";
import { syncDogBadges } from "./services/badges";
import { createWalk, deleteWalk, setWalkHiddenFromProfile } from "./services/walks";
import { RoutePrivacy, WalkTag } from "./types/walk";

export default function App() {
  const [fontsLoaded] = useFonts({ Schoolbell_400Regular });
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [dogManagerOpen, setDogManagerOpen] = useState(false);
  const [dogManagerEditId, setDogManagerEditId] = useState<string | null>(null);
  const [tab, setTab] = useState<AppTab>("home");
  const [routePrivacy, setRoutePrivacy] = useState<RoutePrivacy>("private");
  const [walkTags, setWalkTags] = useState<WalkTag[]>([]);
  const [walkTitle, setWalkTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const saveInFlight = useRef(false);
  const {
    dogs,
    dogsLoading,
    activeDog,
    walks,
    badges,
    setActiveDogId,
    refreshDogs,
    refreshWalks,
    refreshBadges,
  } = useWaltzData(session?.user.id ?? null);

  const { isWalking, walkFinished, seconds, distance, points, trackerReady, startWalk, stopWalk, resetWalk, updateWalkDraftMetadata } = useWalkTracker({
    userId: session?.user.id ?? null,
    onRecoverDogId: setActiveDogId,
    onRecoverMetadata: (metadata) => {
      setWalkTitle(metadata.title);
      setRoutePrivacy(metadata.shareRoute ? "hidden_ends" : "private");
      setWalkTags(metadata.tags);
    },
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true); });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user.id) {
      setTab("home");
    }
  }, [session?.user.id]);

  function beginWalk(shouldShare = false) {
    if (!activeDog) return;
    setRoutePrivacy(shouldShare ? "hidden_ends" : "private");
    setWalkTags([]);
    setWalkTitle("");
    setTab("home");
    startWalk({ dogId: activeDog.id, shareRoute: shouldShare });
  }

  function discardWalk() { setWalkTags([]); setWalkTitle(""); setRoutePrivacy("private"); resetWalk(); }

  async function saveWalk() {
    if (saveInFlight.current) return;
    if (!activeDog) { Alert.alert("No dog selected", "Add a walking buddy first."); return; }
    if (!session?.user.id) { Alert.alert("Session expired", "Please sign in again before saving this walk."); return; }
    saveInFlight.current = true;
    setIsSaving(true);
    let saved = false;
    try {
      await createWalk({
        dogId: activeDog.id,
        title: walkTitle.trim() || defaultWalkTitle(new Date()),
        distanceKm: distance,
        durationSeconds: seconds,
        routePoints: points,
        routePrivacy,
        tags: walkTags,
      });
      saved = true;
      setWalkTags([]); setWalkTitle(""); setRoutePrivacy("private");
      await resetWalk();
      Alert.alert("Saved!", `${activeDog.name} walked ${distance.toFixed(2)} km 🐕`);
      const nextAll = await refreshWalks();
      if (nextAll) {
        const dogWalks = nextAll.filter((walk) => walk.dog_id === activeDog.id);
        await syncDogBadges(activeDog.id, dogWalks);
        await refreshBadges(activeDog.id);
      }
    } catch (error) {
      console.error(saved ? "Post-save refresh error:" : "Save walk error:", error);
      if (!saved) Alert.alert("Save failed", error instanceof Error ? error.message : "Unknown error");
    } finally { saveInFlight.current = false; setIsSaving(false); }
  }

  async function hideWalkFromProfile(walkId: number) { await setWalkHiddenFromProfile(walkId, true); await refreshWalks(); }
  async function removeWalk(walkId: number) { await deleteWalk(walkId); await refreshWalks(); if (activeDog?.id) await refreshBadges(activeDog.id); }
  async function signOut() { const { error } = await supabase.auth.signOut(); if (error) Alert.alert("Sign out failed", error.message); }
  function openDogManager(editId: string | null = null) { setDogManagerEditId(editId); setDogManagerOpen(true); }
  function closeDogManager() { setDogManagerOpen(false); setDogManagerEditId(null); }

  if (!fontsLoaded || !authReady || (session && !trackerReady)) return <View style={styles.container} />;
  if (!session) return <View style={styles.container}><AuthScreen /><StatusBar style="dark" /></View>;
  if (dogsLoading) return <View style={styles.container} />;
  if (dogs.length === 0) return <View style={styles.container}><DogOnboardingScreen userId={session.user.id} onCreated={refreshDogs} /><StatusBar style="dark" /></View>;

  return (
    <View style={styles.container}>
      <AppRouter
        tab={tab}
        userId={session.user.id}
        dogs={dogs}
        activeDog={activeDog}
        walks={walks}
        badges={badges}
        isWalking={isWalking}
        walkFinished={walkFinished}
        seconds={seconds}
        distance={distance}
        points={points}
        walkTitle={walkTitle}
        routePrivacy={routePrivacy}
        walkTags={walkTags}
        isSaving={isSaving}
        dogManagerOpen={dogManagerOpen}
        dogManagerEditId={dogManagerEditId}
        onNavigate={setTab}
        onStartWalk={beginWalk}
        onStopWalk={stopWalk}
        onSaveWalk={saveWalk}
        onDiscardWalk={discardWalk}
        onTitleChange={(value) => {
          setWalkTitle(value);
          updateWalkDraftMetadata({ title: value });
        }}
        onTagsChange={(value) => {
          setWalkTags(value);
          updateWalkDraftMetadata({ tags: value });
        }}
        onRoutePrivacyChange={(value) => {
          setRoutePrivacy(value);
          updateWalkDraftMetadata({ shareRoute: value !== "private" });
        }}
        onOpenDogs={openDogManager}
        onCloseDogs={closeDogManager}
        onDogsChanged={refreshDogs}
        onSelectDog={setActiveDogId}
        onHideWalk={hideWalkFromProfile}
        onDeleteWalk={removeWalk}
        onSignOut={signOut}
      />
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: "#F8F3E9", paddingHorizontal: 18, paddingTop: 68, paddingBottom: 8 } });
