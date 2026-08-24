import { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Schoolbell_400Regular, useFonts } from "@expo-google-fonts/schoolbell";
import type { Session } from "@supabase/supabase-js";
import { AuthScreen } from "./components/AuthScreen";
import { DogManagerModal } from "./components/DogManagerModal";
import { DogOnboardingScreen } from "./components/DogOnboardingScreen";
import { FeedScreen } from "./components/FeedScreen";
import { HomeScreen } from "./components/HomeScreen";
import { AppTab, HubScreen } from "./components/HubScreen";
import { HistoryScreen } from "./components/HistoryScreen";
import { MeScreen } from "./components/MeScreen";
import { defaultWalkTitle, WalkCompleteScreen } from "./components/WalkCompleteScreen";
import { WalkingScreen } from "./components/WalkingScreen";
import { useWalkTracker } from "./hooks/useWalkTracker";
import { supabase } from "./lib/supabase";
import { fetchDogBadges, syncDogBadges } from "./services/badges";
import { fetchDogsForUser } from "./services/dogs";
import { createWalk, deleteWalk, fetchWalks, setWalkHiddenFromProfile } from "./services/walks";
import { DogBadge } from "./types/badge";
import { Dog } from "./types/dog";
import { RoutePrivacy, Walk, WalkTag } from "./types/walk";

export default function App() {
  const [fontsLoaded] = useFonts({ Schoolbell_400Regular });
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [dogsLoading, setDogsLoading] = useState(false);
  const [activeDogId, setActiveDogId] = useState<string | null>(null);
  const [dogManagerOpen, setDogManagerOpen] = useState(false);
  const [dogManagerEditId, setDogManagerEditId] = useState<string | null>(null);
  const [allWalks, setAllWalks] = useState<Walk[]>([]);
  const [badges, setBadges] = useState<DogBadge[]>([]);
  const [tab, setTab] = useState<AppTab>("home");
  const [routePrivacy, setRoutePrivacy] = useState<RoutePrivacy>("private");
  const [walkTags, setWalkTags] = useState<WalkTag[]>([]);
  const [walkTitle, setWalkTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const saveInFlight = useRef(false);

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
      setDogs([]); setAllWalks([]); setBadges([]); setActiveDogId(null); setTab("home");
      return;
    }
    loadDogs(session.user.id);
    loadWalks();
  }, [session?.user.id]);

  const activeDog = dogs.find((dog) => dog.id === activeDogId) || dogs[0];
  const walks = activeDog ? allWalks.filter((walk) => walk.dog_id === activeDog.id) : [];

  useEffect(() => { if (activeDog?.id) loadBadges(activeDog.id); }, [activeDog?.id]);

  async function loadDogs(userId: string) {
    setDogsLoading(true);
    try {
      const next = await fetchDogsForUser(userId);
      setDogs(next);
      setActiveDogId((current) => current && next.some((dog) => dog.id === current) ? current : next[0]?.id ?? null);
    } catch (error) { console.error("Load dogs error:", error); }
    finally { setDogsLoading(false); }
  }

  async function loadWalks() {
    try { const next = await fetchWalks(); setAllWalks(next); return next; }
    catch (error) { console.error("Load walks error:", error); return null; }
  }

  async function loadBadges(dogId: string) {
    try { setBadges(await fetchDogBadges(dogId)); }
    catch (error) { console.error("Load badges error:", error); }
  }

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
      const nextAll = await loadWalks();
      if (nextAll) {
        const dogWalks = nextAll.filter((walk) => walk.dog_id === activeDog.id);
        await syncDogBadges(activeDog.id, dogWalks);
        await loadBadges(activeDog.id);
      }
    } catch (error) {
      console.error(saved ? "Post-save refresh error:" : "Save walk error:", error);
      if (!saved) Alert.alert("Save failed", error instanceof Error ? error.message : "Unknown error");
    } finally { saveInFlight.current = false; setIsSaving(false); }
  }

  async function hideWalkFromProfile(walkId: number) { await setWalkHiddenFromProfile(walkId, true); await loadWalks(); }
  async function removeWalk(walkId: number) { await deleteWalk(walkId); await loadWalks(); if (activeDog?.id) await loadBadges(activeDog.id); }
  async function signOut() { const { error } = await supabase.auth.signOut(); if (error) Alert.alert("Sign out failed", error.message); }
  function openDogManager(editId: string | null = null) { setDogManagerEditId(editId); setDogManagerOpen(true); }
  function closeDogManager() { setDogManagerOpen(false); setDogManagerEditId(null); }

  if (!fontsLoaded || !authReady || (session && !trackerReady)) return <View style={styles.container} />;
  if (!session) return <View style={styles.container}><AuthScreen /><StatusBar style="dark" /></View>;
  if (dogsLoading) return <View style={styles.container} />;
  if (dogs.length === 0) return <View style={styles.container}><DogOnboardingScreen userId={session.user.id} onCreated={() => loadDogs(session.user.id)} /><StatusBar style="dark" /></View>;

  let content;
  if (walkFinished) content = <WalkCompleteScreen seconds={seconds} distance={distance} points={points} dogName={activeDog.name} title={walkTitle} routePrivacy={routePrivacy} tags={walkTags} isSaving={isSaving} onTitleChange={(value) => { setWalkTitle(value); updateWalkDraftMetadata({ title: value }); }} onTagsChange={(value) => { setWalkTags(value); updateWalkDraftMetadata({ tags: value }); }} onRoutePrivacyChange={(value) => { setRoutePrivacy(value); updateWalkDraftMetadata({ shareRoute: value !== "private" }); }} onSave={saveWalk} onDiscard={discardWalk} />;
  else if (isWalking) content = <WalkingScreen seconds={seconds} distance={distance} points={points} dogName={activeDog.name} onStopWalk={stopWalk} />;
  else if (tab === "me") content = <MeScreen dog={activeDog} walks={walks} badges={badges} onNavigate={setTab} onStartWalk={beginWalk} onEditDog={() => openDogManager(activeDog.id)} onHideWalk={hideWalkFromProfile} onDeleteWalk={removeWalk} onSignOut={signOut} />;
  else if (tab === "map") content = <HistoryScreen dog={activeDog} walks={walks} badges={badges} onNavigate={setTab} onStartWalk={beginWalk} />;
  else if (tab === "community") content = <FeedScreen dog={activeDog} viewerWalks={walks} onNavigate={setTab} onStartWalk={beginWalk} />;
  else if (tab !== "home") content = <HubScreen tab={tab} walks={walks} dog={activeDog} onNavigate={setTab} onStartWalk={beginWalk} />;
  else content = <HomeScreen walks={walks} dog={activeDog} onStartWalk={beginWalk} onNavigate={setTab} onOpenDogs={() => openDogManager(null)} />;

  return <View style={styles.container}>{content}<DogManagerModal visible={dogManagerOpen} userId={session.user.id} dogs={dogs} activeDogId={activeDog.id} initialEditDogId={dogManagerEditId} onClose={closeDogManager} onChanged={() => loadDogs(session.user.id)} onSelect={setActiveDogId} /><StatusBar style="dark" /></View>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: "#F8F3E9", paddingHorizontal: 18, paddingTop: 68, paddingBottom: 8 } });
