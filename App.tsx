import { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Schoolbell_400Regular, useFonts } from "@expo-google-fonts/schoolbell";
import type { Session } from "@supabase/supabase-js";
import { AuthScreen } from "./components/AuthScreen";
import { DogOnboardingScreen } from "./components/DogOnboardingScreen";
import { HomeScreen } from "./components/HomeScreen";
import { AppTab, HubScreen } from "./components/HubScreen";
import { WalkCompleteScreen } from "./components/WalkCompleteScreen";
import { WalkingScreen } from "./components/WalkingScreen";
import { useWalkTracker } from "./hooks/useWalkTracker";
import { supabase } from "./lib/supabase";
import { fetchDogsForUser } from "./services/dogs";
import { createWalk, fetchWalks } from "./services/walks";
import { Dog } from "./types/dog";
import { Walk, WalkTag } from "./types/walk";

export default function App() {
  const [fontsLoaded] = useFonts({ Schoolbell_400Regular });
  const [authReady,setAuthReady]=useState(false), [session,setSession]=useState<Session|null>(null);
  const [dogs,setDogs]=useState<Dog[]>([]), [dogsLoading,setDogsLoading]=useState(false), [walks,setWalks]=useState<Walk[]>([]);
  const [tab,setTab]=useState<AppTab>("home"), [shareRoute,setShareRoute]=useState(false), [walkTags,setWalkTags]=useState<WalkTag[]>([]);
  const {isWalking,walkFinished,seconds,distance,points,startWalk,stopWalk,resetWalk}=useWalkTracker();
  useEffect(()=>{supabase.auth.getSession().then(({data})=>{setSession(data.session);setAuthReady(true)});const{data:a}=supabase.auth.onAuthStateChange((_e,s)=>{setSession(s);setAuthReady(true)});return()=>a.subscription.unsubscribe()},[]);
  useEffect(()=>{if(!session?.user.id){setDogs([]);setWalks([]);setTab("home");return}loadDogs(session.user.id);loadWalks()},[session?.user.id]);
  async function loadDogs(userId:string){setDogsLoading(true);try{setDogs(await fetchDogsForUser(userId))}catch(error){console.error("Load dogs error:",error)}finally{setDogsLoading(false)}}
  async function loadWalks(){try{setWalks(await fetchWalks())}catch(error){console.error("Load walks error:",error)}}
  function beginWalk(shouldShare=false){setShareRoute(shouldShare);setWalkTags([]);setTab("home");startWalk()}
  function discardWalk(){setWalkTags([]);resetWalk()}
  async function saveWalk(){const activeDog=dogs[0];if(!activeDog){Alert.alert("No dog selected","Add a walking buddy first.");return}if(!session?.user.id){Alert.alert("Session expired","Please sign in again before saving this walk.");return}try{await createWalk({userId:session.user.id,dogId:activeDog.id,dogName:activeDog.name,distanceKm:distance,durationSeconds:seconds,routePoints:points,shareRoute,tags:walkTags});await loadWalks();Alert.alert("Saved!",`${activeDog.name} walked ${distance.toFixed(2)} km 🐕`);setWalkTags([]);resetWalk()}catch(error){const message=error instanceof Error?error.message:"Unknown error";console.error(error);Alert.alert("Save failed",message)}}
  async function signOut(){const{error}=await supabase.auth.signOut();if(error)Alert.alert("Sign out failed",error.message)}
  if(!fontsLoaded||!authReady)return <View style={styles.container}/>;
  if(!session)return <View style={styles.container}><AuthScreen/><StatusBar style="dark"/></View>;
  if(dogsLoading)return <View style={styles.container}/>;
  if(dogs.length===0)return <View style={styles.container}><DogOnboardingScreen userId={session.user.id} onCreated={()=>loadDogs(session.user.id)}/><StatusBar style="dark"/></View>;
  const activeDog=dogs[0];let content;
  if(walkFinished)content=<WalkCompleteScreen seconds={seconds} distance={distance} points={points} dogName={activeDog.name} shareRoute={shareRoute} tags={walkTags} onTagsChange={setWalkTags} onShareRouteChange={setShareRoute} onSave={saveWalk} onDiscard={discardWalk}/>;
  else if(isWalking)content=<WalkingScreen seconds={seconds} distance={distance} points={points} dogName={activeDog.name} onStopWalk={stopWalk}/>;
  else if(tab!=="home")content=<HubScreen tab={tab} walks={walks} dog={activeDog} onNavigate={setTab} onStartWalk={()=>beginWalk(false)} onSignOut={signOut}/>;
  else content=<HomeScreen walks={walks} onStartWalk={beginWalk} onNavigate={setTab}/>;
  return <View style={styles.container}>{content}<StatusBar style="dark"/></View>;
}
const styles=StyleSheet.create({container:{flex:1,backgroundColor:"#F8F3E9",paddingHorizontal:18,paddingTop:68,paddingBottom:8}});
