import { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Schoolbell_400Regular, useFonts } from "@expo-google-fonts/schoolbell";
import type { Session } from "@supabase/supabase-js";
import { AppRouter } from "./components/AppRouter";
import { AuthScreen } from "./components/AuthScreen";
import { DogOnboardingScreen } from "./components/DogOnboardingScreen";
import { AppTab } from "./components/HubScreen";
import { useWaltzData } from "./hooks/useWaltzData";
import { useWalkCompletion } from "./hooks/useWalkCompletion";
import { useWalkTracker } from "./hooks/useWalkTracker";
import { supabase } from "./lib/supabase";
import { deleteWalk, setWalkHiddenFromProfile } from "./services/walks";

export default function App() {
  const [fontsLoaded] = useFonts({ Schoolbell_400Regular });
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [dogManagerOpen, setDogManagerOpen] = useState(false);
  const [dogManagerEditId, setDogManagerEditId] = useState<string | null>(null);
  const [tab, setTab] = useState<AppTab>("home");
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
  const {
    routePrivacy,
    walkTags,
    walkTitle,
    isSaving,
    setRoutePrivacy,
    setWalkTags,
    setWalkTitle,
    recoverMetadata,
    prepareWalk,
    discardCompletedWalk,
    saveCompletedWalk,
  } = useWalkCompletion({
    userId: session?.user.id ?? null,
    activeDog,
    refreshWalks,
    refreshBadges,
  });

  const { isWalking, walkFinished, seconds, distance, points, trackerReady, startWalk, stopWalk, resetWalk, updateWalkDraftMetadata } = useWalkTracker({
    userId: session?.user.id ?? null,
    onRecoverDogId: setActiveDogId,
    onRecoverMetadata: recoverMetadata,
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
    prepareWalk(shouldShare);
    setTab("home");
    startWalk({ dogId: activeDog.id, shareRoute: shouldShare });
  }

  function discardWalk() {
    void discardCompletedWalk(resetWalk);
  }

  function saveWalk() {
    return saveCompletedWalk({ distance, seconds, points, resetWalk });
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
