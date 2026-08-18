import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Balloon, Bird, Coffee, Dog as DogIcon, Fish, Flag, Flame, House, MapPin, MoonStar, Mountain, PawPrint, Umbrella } from "@sketchyicons/react-native";
import { Dog } from "../types/dog";
import { Walk } from "../types/walk";
import { calculateWalkStreak } from "../utils/streak";

export type AppTab = "home" | "map" | "community" | "me" | "leaderboard" | "stats" | "challenges";
type Props = { tab: Exclude<AppTab, "home">; walks: Walk[]; dog: Dog; onNavigate: (tab: AppTab) => void; onStartWalk: () => void; onSignOut: () => void };
function formatDuration(seconds: number) { const minutes = Math.round(seconds / 60); if (minutes < 60) return `${minutes} min`; return `${Math.floor(minutes / 60)}h ${minutes % 60}m`; }

export function HubScreen({ tab, walks, dog, onNavigate, onStartWalk, onSignOut }: Props) {
  const totalDistance = walks.reduce((sum, walk) => sum + walk.distance_km, 0);
  const totalSeconds = walks.reduce((sum, walk) => sum + walk.duration_seconds, 0);
  const streak = calculateWalkStreak(walks);
  const longest = walks.reduce((best, walk) => Math.max(best, walk.distance_km), 0);
  const earlyBirdWalks = walks.filter((walk) => new Date(walk.ended_at).getHours() < 8).length;
  const nightShiftWalks = walks.filter((walk) => new Date(walk.ended_at).getHours() >= 20).length;
  const tags = (tag: string) => walks.filter((walk) => walk.tags?.includes(tag)).length;
  const title = { map: "Walk history", community: "Community", me: dog.name, leaderboard: "Leaderboard", stats: "Stats", challenges: "Challenges" }[tab];

  return <View style={styles.screen}>
    <View style={styles.header}><Text style={styles.title}>{title}</Text></View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {tab === "map" && <><Text style={styles.kicker}>YOUR PAWPRINTS</Text>{walks.length === 0 ? <Empty text="Your walks will appear here after your first save." /> : walks.map((walk) => <View key={walk.id} style={styles.card}><View style={styles.row}><Text style={styles.cardTitle}>🐾 {walk.dog_name}</Text><Text style={styles.date}>{new Date(walk.ended_at).toLocaleDateString("en-AU")}</Text></View><Text style={styles.big}>{walk.distance_km.toFixed(2)} km</Text><Text style={styles.muted}>{formatDuration(walk.duration_seconds)}</Text></View>)}</>}
      {tab === "stats" && <View style={styles.grid}><Stat label="Walks" value={`${walks.length}`} icon="🐾" /><Stat label="Distance" value={`${totalDistance.toFixed(1)} km`} icon="⛰️" /><Stat label="Time" value={formatDuration(totalSeconds)} icon="⏱️" /><Stat label="Longest" value={`${longest.toFixed(1)} km`} icon="🌭" /></View>}
      {tab === "leaderboard" && <><Text style={styles.kicker}>FRIENDS LEAGUE · PREVIEW</Text><View style={styles.podium}><Text style={styles.podiumEmoji}>🏆</Text><Text style={styles.big}>{dog.name}</Text><Text style={styles.muted}>{totalDistance.toFixed(1)} km total</Text></View><Empty text="Friend rankings land here once community profiles are connected." /></>}
      {tab === "challenges" && <>
        <Challenge icon={<Flame size={25} strokeWidth={2} color="#E87859" />} title="Keep the flame" progress={`${Math.min(streak, 7)}/7 days`} done={streak >= 7} />
        <Challenge icon={<Balloon size={25} strokeWidth={2} color="#8C9670" />} title="Ten tiny adventures" progress={`${Math.min(walks.length, 10)}/10 walks`} done={walks.length >= 10} />
        {[10,100,500,1000].map((km) => <Challenge key={km} icon={<Flag size={25} strokeWidth={2} color="#8C9670" />} title={`First ${km.toLocaleString()} km`} progress={`${Math.min(totalDistance, km).toFixed(1)}/${km.toLocaleString()} km`} done={totalDistance >= km} />)}
        <Challenge icon={<Mountain size={25} strokeWidth={2} color="#8C9670" />} title="Trail" progress={`${Math.min(tags("trail"), 5)}/5 trail walks`} done={tags("trail") >= 5} />
        <Challenge icon={<Fish size={25} strokeWidth={2} color="#8C9670" />} title="Gone fishing" progress={`${Math.min(tags("swim"), 5)}/5 splashy walks`} done={tags("swim") >= 5} />
        <Challenge icon={<Coffee size={25} strokeWidth={2} color="#8C9670" />} title="Coffee stop" progress={`${Math.min(tags("coffee"), 10)}/10 coffee walks`} done={tags("coffee") >= 10} />
        <Challenge icon={<Bird size={25} strokeWidth={2} color="#8C9670" />} title="Early bird" progress={`${Math.min(earlyBirdWalks, 3)}/3 walks before 8am`} done={earlyBirdWalks >= 3} />
        <Challenge icon={<MoonStar size={25} strokeWidth={2} color="#8C9670" />} title="Night shift" progress={`${Math.min(nightShiftWalks, 3)}/3 walks after 8pm`} done={nightShiftWalks >= 3} />
        <Challenge icon={<Umbrella size={25} strokeWidth={2} color="#8C9670" />} title="Rainy day" progress="Weather tracking coming soon" done={false} />
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
  </View>;
}

function Stat({ label, value, icon }: { label: string; value: string; icon: string }) { return <View style={styles.stat}><Text style={styles.statIcon}>{icon}</Text><Text style={styles.muted}>{label}</Text><Text style={styles.statValue}>{value}</Text></View>; }
function Empty({ text }: { text: string }) { return <View style={styles.empty}><Text style={styles.emptyText}>{text}</Text></View>; }
function Challenge({ icon, title, progress, done }: { icon: React.ReactNode; title: string; progress: string; done: boolean }) { return <View style={styles.card}><View style={styles.row}><View style={styles.challengeTitle}><View style={styles.challengeIcon}>{icon}</View><Text style={styles.cardTitle}>{title}</Text></View><Text>{done ? "✓" : "○"}</Text></View><Text style={styles.muted}>{progress}</Text></View>; }
function Nav({icon,label,active,onPress}:{icon:React.ReactNode;label:string;active?:boolean;onPress:()=>void}) { return <Pressable style={styles.navItem} onPress={onPress}>{icon}<Text style={[styles.navLabel,active&&styles.active]}>{label}</Text></Pressable>; }

const styles = StyleSheet.create({ screen:{flex:1,justifyContent:"space-between"},header:{alignItems:"center",marginBottom:18},title:{fontFamily:"Schoolbell_400Regular",fontSize:34,color:"#1D1A17"},content:{paddingBottom:24,gap:12},kicker:{fontSize:12,fontWeight:"800",letterSpacing:1.5,color:"#8C9670",marginBottom:2},card:{backgroundColor:"#FFFDF8",borderRadius:22,padding:18},row:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},challengeTitle:{flexDirection:"row",alignItems:"center",gap:10},challengeIcon:{width:28,alignItems:"center"},cardTitle:{fontSize:17,fontWeight:"700",color:"#1D1A17"},date:{fontSize:12,color:"#756B60"},big:{fontSize:25,fontWeight:"800",color:"#1D1A17",marginTop:8},muted:{color:"#756B60",marginTop:4},empty:{padding:22,borderRadius:22,backgroundColor:"#F1E7D7"},emptyText:{color:"#655D54",lineHeight:20},grid:{flexDirection:"row",flexWrap:"wrap",gap:10},stat:{width:"48%",minHeight:140,backgroundColor:"#FFFDF8",borderRadius:24,padding:18,justifyContent:"center"},statIcon:{fontSize:28,marginBottom:8},statValue:{fontSize:22,fontWeight:"800",color:"#1D1A17",marginTop:5},podium:{alignItems:"center",backgroundColor:"#FFFDF8",borderRadius:28,padding:28},podiumEmoji:{fontSize:46},profile:{alignItems:"center",paddingVertical:20},avatar:{fontSize:64},secondaryButton:{padding:16,alignItems:"center"},secondaryText:{color:"#B85F4A",fontWeight:"700"},nav:{height:68,borderRadius:25,backgroundColor:"#FFFDF8",flexDirection:"row",alignItems:"center",justifyContent:"space-around"},navItem:{width:58,alignItems:"center"},navLabel:{fontSize:9,color:"#443D37",marginTop:2},active:{color:"#78845C",fontWeight:"800"},heart:{fontSize:22,color:"#332E29"},pawButton:{width:60,height:60,borderRadius:30,backgroundColor:"#89936B",alignItems:"center",justifyContent:"center",marginTop:-20} });
