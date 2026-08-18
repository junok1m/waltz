import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Balloon, Bird, Coffee, Dog as DogIcon, Fish, Flag, Flame, Footprints, House, MapPin, MoonStar, Mountain, PawPrint, Route, Ruler, Timer, Umbrella } from "@sketchyicons/react-native";
import { Dog } from "../types/dog";
import { Walk } from "../types/walk";
import { calculateWalkStreak } from "../utils/streak";

export type AppTab = "home" | "map" | "community" | "me" | "leaderboard" | "stats" | "challenges";
type Props = { tab: Exclude<AppTab, "home">; walks: Walk[]; dog: Dog; onNavigate: (tab: AppTab) => void; onStartWalk: () => void; onSignOut: () => void };
type ChallengeInfo = { title: string; progress: string; description: string; done: boolean; icon: React.ReactNode; color: string };
function formatDuration(seconds: number) { const minutes = Math.round(seconds / 60); if (minutes < 60) return `${minutes} min`; return `${Math.floor(minutes / 60)}h ${minutes % 60}m`; }

export function HubScreen({ tab, walks, dog, onNavigate, onStartWalk, onSignOut }: Props) {
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeInfo | null>(null);
  const totalDistance = walks.reduce((sum, walk) => sum + walk.distance_km, 0);
  const totalSeconds = walks.reduce((sum, walk) => sum + walk.duration_seconds, 0);
  const streak = calculateWalkStreak(walks);
  const longest = walks.reduce((best, walk) => Math.max(best, walk.distance_km), 0);
  const earlyBirdWalks = walks.filter((walk) => new Date(walk.ended_at).getHours() < 8).length;
  const nightShiftWalks = walks.filter((walk) => new Date(walk.ended_at).getHours() >= 20).length;
  const tags = (tag: string) => walks.filter((walk) => walk.tags?.includes(tag)).length;
  const title = { map: "Walk history", community: "Community", me: dog.name, leaderboard: "Leaderboard", stats: "Stats", challenges: "Challenges" }[tab];

  const badgeChallenges: ChallengeInfo[] = [
    { title:"Keep the flame", progress:`${Math.min(streak,7)}/7`, description:"Complete a walk on 7 consecutive days.", done:streak>=7, icon:<Flame size={31} strokeWidth={2} color="#E87859"/>, color:"#F7DDD4" },
    { title:"Tiny adventures", progress:`${Math.min(walks.length,10)}/10`, description:"Complete 10 walks.", done:walks.length>=10, icon:<Balloon size={31} strokeWidth={2} color="#6F7D54"/>, color:"#E5EBDD" },
    { title:"Trail", progress:`${Math.min(tags("trail"),5)}/5`, description:"Complete 5 walks tagged as Trail.", done:tags("trail")>=5, icon:<Mountain size={31} strokeWidth={2} color="#796B54"/>, color:"#EEE0C8" },
    { title:"Gone fishing", progress:`${Math.min(tags("swim"),5)}/5`, description:"Have a swim or splash on 5 walks and tag them Gone fishing.", done:tags("swim")>=5, icon:<Fish size={31} strokeWidth={2} color="#557784"/>, color:"#DDEAF0" },
    { title:"Coffee stop", progress:`${Math.min(tags("coffee"),10)}/10`, description:"Make a coffee stop on 10 walks.", done:tags("coffee")>=10, icon:<Coffee size={31} strokeWidth={2} color="#806451"/>, color:"#EADDD2" },
    { title:"Early bird", progress:`${Math.min(earlyBirdWalks,3)}/3`, description:"Complete 3 walks before 8am.", done:earlyBirdWalks>=3, icon:<Bird size={31} strokeWidth={2} color="#7A6F51"/>, color:"#F6EBC4" },
    { title:"Night shift", progress:`${Math.min(nightShiftWalks,3)}/3`, description:"Complete 3 walks after 8pm.", done:nightShiftWalks>=3, icon:<MoonStar size={31} strokeWidth={2} color="#666584"/>, color:"#E3E0F1" },
    { title:"Rainy day", progress:"0/1", description:"Complete a walk while it is raining. Automatic weather detection is coming soon.", done:false, icon:<Umbrella size={31} strokeWidth={2} color="#5D7680"/>, color:"#DDE8EA" },
  ];

  const mileageChallenges: ChallengeInfo[] = [10,100,500,1000].map((km,index)=>({
    title:`First ${km.toLocaleString()} km`, progress:`${Math.min(totalDistance,km).toFixed(1)}/${km.toLocaleString()} km`, description:`Walk a total of ${km.toLocaleString()} km with ${dog.name}.`, done:totalDistance>=km,
    icon:<Flag size={30} strokeWidth={2} color="#687455"/>, color:["#E5EBDD","#F6EBC4","#F1DCD3","#DDE8EA"][index],
  }));

  return <View style={styles.screen}>
    <View style={styles.header}><Text style={styles.title}>{title}</Text></View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {tab === "map" && <><Text style={styles.kicker}>YOUR PAWPRINTS</Text>{walks.length === 0 ? <Empty text="Your walks will appear here after your first save." /> : walks.map((walk) => <View key={walk.id} style={styles.card}><View style={styles.row}><Text style={styles.cardTitle}>🐾 {walk.dog_name}</Text><Text style={styles.date}>{new Date(walk.ended_at).toLocaleDateString("en-AU")}</Text></View><Text style={styles.big}>{walk.distance_km.toFixed(2)} km</Text><Text style={styles.muted}>{formatDuration(walk.duration_seconds)}</Text></View>)}</>}
      {tab === "stats" && <View style={styles.grid}><Stat label="Walks" value={`${walks.length}`} icon={<Footprints size={29} strokeWidth={2} color="#78845C" />} /><Stat label="Distance" value={`${totalDistance.toFixed(1)} km`} icon={<Ruler size={29} strokeWidth={2} color="#78845C" />} /><Stat label="Time" value={formatDuration(totalSeconds)} icon={<Timer size={29} strokeWidth={2} color="#78845C" />} /><Stat label="Longest" value={`${longest.toFixed(1)} km`} icon={<Route size={29} strokeWidth={2} color="#78845C" />} /></View>}
      {tab === "leaderboard" && <><Text style={styles.kicker}>FRIENDS LEAGUE · PREVIEW</Text><View style={styles.podium}><Text style={styles.podiumEmoji}>🏆</Text><Text style={styles.big}>{dog.name}</Text><Text style={styles.muted}>{totalDistance.toFixed(1)} km total</Text></View><Empty text="Friend rankings land here once community profiles are connected." /></>}
      {tab === "challenges" && <>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Badges</Text><Text style={styles.sectionCopy}>Tap a badge to see how to earn it.</Text></View>
        <View style={styles.badgeGrid}>{badgeChallenges.map((challenge)=><Badge key={challenge.title} challenge={challenge} onPress={()=>setSelectedChallenge(challenge)}/>)}</View>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Mileage</Text><Text style={styles.sectionCopy}>Tiny paws, suspiciously large numbers.</Text></View>
        <View style={styles.mileageGrid}>{mileageChallenges.map((challenge)=><MileageBadge key={challenge.title} challenge={challenge} onPress={()=>setSelectedChallenge(challenge)}/>)}</View>
      </>}
      {tab === "community" && <><View style={styles.podium}><Text style={styles.podiumEmoji}>🐕🐩🦮</Text><Text style={styles.big}>The park is quiet... for now</Text></View><Empty text="Friends, shared walks and neighbourhood posts will live here. The shell is ready for the social backend." /></>}
      {tab === "me" && <><View style={styles.profile}><Text style={styles.avatar}>🐕</Text><Text style={styles.big}>{dog.name}</Text><Text style={styles.muted}>{dog.breed || "Very good dog"}</Text></View><View style={styles.card}><Text style={styles.cardTitle}>🔥 {streak} day streak</Text><Text style={styles.muted}>{walks.length} walks · {totalDistance.toFixed(1)} km together</Text></View><Pressable style={styles.secondaryButton} onPress={onSignOut}><Text style={styles.secondaryText}>Sign out</Text></Pressable></>}
    </ScrollView>
    <View style={styles.nav}>
      <Nav icon={<House size={22} strokeWidth={2} color="#332E29" />} label="Home" onPress={() => onNavigate("home")} />
      <Nav icon={<MapPin size={22} strokeWidth={2} color={tab === "map" ? "#78845C" : "#332E29"} />} label="History" active={tab === "map"} onPress={() => onNavigate("map")} />
      <Pressable style={styles.pawButton} onPress={onStartWalk}><PawPrint size={27} strokeWidth={2} color="#FFFDF8" /></Pressable>
      <Nav icon={<Text style={styles.heart}>♡</Text>} label="Community" active={tab === "community"} onPress={() => onNavigate("community")} />
      <Nav icon={<DogIcon size={22} strokeWidth={2} color={tab === "me" ? "#78845C" : "#332E29"} />} label="Me" active={tab === "me"} onPress={() => onNavigate("me")} />
    </View>
    <Modal visible={!!selectedChallenge} transparent animationType="fade" onRequestClose={()=>setSelectedChallenge(null)}>
      <Pressable style={styles.modalOverlay} onPress={()=>setSelectedChallenge(null)}>
        <Pressable style={styles.modalCard} onPress={()=>{}}>
          {selectedChallenge && <><View style={[styles.modalBadge,selectedChallenge.done&&{backgroundColor:selectedChallenge.color}]}>{selectedChallenge.icon}</View><Text style={styles.modalTitle}>{selectedChallenge.title}</Text><Text style={styles.modalProgress}>{selectedChallenge.progress}</Text><Text style={styles.modalDescription}>{selectedChallenge.description}</Text>{selectedChallenge.done?<Text style={styles.earned}>Badge earned ✓</Text>:null}<Pressable style={styles.closeButton} onPress={()=>setSelectedChallenge(null)}><Text style={styles.closeText}>Got it</Text></Pressable></>}
        </Pressable>
      </Pressable>
    </Modal>
  </View>;
}

function Badge({challenge,onPress}:{challenge:ChallengeInfo;onPress:()=>void}) { return <Pressable style={styles.badgeItem} onPress={onPress}><View style={[styles.badgeCircle,challenge.done&&{backgroundColor:challenge.color,borderColor:challenge.color}]}>{challenge.icon}</View><Text numberOfLines={1} style={styles.badgeTitle}>{challenge.title}</Text><Text style={styles.badgeProgress}>{challenge.progress}</Text></Pressable>; }
function MileageBadge({challenge,onPress}:{challenge:ChallengeInfo;onPress:()=>void}) { return <Pressable style={styles.mileageItem} onPress={onPress}><View style={[styles.mileageCircle,challenge.done&&{backgroundColor:challenge.color,borderColor:challenge.color}]}>{challenge.icon}</View><Text style={styles.mileageTitle}>{challenge.title.replace("First ","")}</Text><Text style={styles.badgeProgress}>{challenge.progress}</Text></Pressable>; }
function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <View style={styles.stat}><View style={styles.statIcon}>{icon}</View><Text style={styles.muted}>{label}</Text><Text style={styles.statValue}>{value}</Text></View>; }
function Empty({ text }: { text: string }) { return <View style={styles.empty}><Text style={styles.emptyText}>{text}</Text></View>; }
function Nav({icon,label,active,onPress}:{icon:React.ReactNode;label:string;active?:boolean;onPress:()=>void}) { return <Pressable style={styles.navItem} onPress={onPress}>{icon}<Text style={[styles.navLabel,active&&styles.active]}>{label}</Text></Pressable>; }

const styles = StyleSheet.create({
  screen:{flex:1,justifyContent:"space-between"},header:{alignItems:"center",marginBottom:18},title:{fontFamily:"Schoolbell_400Regular",fontSize:34,color:"#1D1A17"},content:{paddingBottom:24,gap:12},kicker:{fontSize:12,fontWeight:"800",letterSpacing:1.5,color:"#8C9670",marginBottom:2},card:{backgroundColor:"#FFFDF8",borderRadius:22,padding:18},row:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},cardTitle:{fontSize:17,fontWeight:"700",color:"#1D1A17"},date:{fontSize:12,color:"#756B60"},big:{fontSize:25,fontWeight:"800",color:"#1D1A17",marginTop:8},muted:{color:"#756B60",marginTop:4},empty:{padding:22,borderRadius:22,backgroundColor:"#F1E7D7"},emptyText:{color:"#655D54",lineHeight:20},grid:{flexDirection:"row",flexWrap:"wrap",gap:10},stat:{width:"48%",minHeight:140,backgroundColor:"#FFFDF8",borderRadius:24,padding:18,justifyContent:"center"},statIcon:{height:32,justifyContent:"center",marginBottom:8},statValue:{fontSize:22,fontWeight:"800",color:"#1D1A17",marginTop:5},podium:{alignItems:"center",backgroundColor:"#FFFDF8",borderRadius:28,padding:28},podiumEmoji:{fontSize:46},profile:{alignItems:"center",paddingVertical:20},avatar:{fontSize:64},secondaryButton:{padding:16,alignItems:"center"},secondaryText:{color:"#B85F4A",fontWeight:"700"},
  sectionHeader:{marginTop:4,marginBottom:4},sectionTitle:{fontFamily:"Schoolbell_400Regular",fontSize:27,color:"#1D1A17"},sectionCopy:{fontSize:11,color:"#756B60",marginTop:1},badgeGrid:{flexDirection:"row",flexWrap:"wrap",rowGap:20,columnGap:8,justifyContent:"flex-start",marginBottom:18},badgeItem:{width:"23%",alignItems:"center"},badgeCircle:{width:72,height:72,borderRadius:36,borderWidth:2,borderColor:"#CFC5B7",backgroundColor:"#FFFDF8",alignItems:"center",justifyContent:"center"},badgeTitle:{fontSize:10,fontWeight:"800",color:"#332E29",marginTop:7,maxWidth:82},badgeProgress:{fontSize:9,color:"#82786E",marginTop:2},mileageGrid:{flexDirection:"row",justifyContent:"space-between",marginBottom:8},mileageItem:{width:"23%",alignItems:"center"},mileageCircle:{width:66,height:66,borderRadius:33,borderWidth:2,borderColor:"#CFC5B7",backgroundColor:"#FFFDF8",alignItems:"center",justifyContent:"center"},mileageTitle:{fontSize:11,fontWeight:"800",color:"#332E29",marginTop:7},
  modalOverlay:{flex:1,backgroundColor:"rgba(0,0,0,.3)",alignItems:"center",justifyContent:"center",padding:28},modalCard:{width:"100%",maxWidth:360,backgroundColor:"#FFFDF8",borderRadius:30,padding:26,alignItems:"center"},modalBadge:{width:92,height:92,borderRadius:46,borderWidth:2,borderColor:"#CFC5B7",alignItems:"center",justifyContent:"center",marginBottom:14},modalTitle:{fontFamily:"Schoolbell_400Regular",fontSize:30,color:"#1D1A17"},modalProgress:{fontSize:13,fontWeight:"800",color:"#78845C",marginTop:3},modalDescription:{fontSize:14,lineHeight:20,color:"#655D54",textAlign:"center",marginTop:14},earned:{fontSize:12,fontWeight:"800",color:"#596442",marginTop:12},closeButton:{backgroundColor:"#8C9670",paddingHorizontal:28,paddingVertical:12,borderRadius:999,marginTop:20},closeText:{color:"#FFFDF8",fontWeight:"800"},
  nav:{height:68,borderRadius:25,backgroundColor:"#FFFDF8",flexDirection:"row",alignItems:"center",justifyContent:"space-around"},navItem:{width:58,alignItems:"center"},navLabel:{fontSize:9,color:"#443D37",marginTop:2},active:{color:"#78845C",fontWeight:"800"},heart:{fontSize:22,color:"#332E29"},pawButton:{width:60,height:60,borderRadius:30,backgroundColor:"#89936B",alignItems:"center",justifyContent:"center",marginTop:-20}
});
