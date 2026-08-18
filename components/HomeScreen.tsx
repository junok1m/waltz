import { useState } from "react";
import { Modal, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import {
  ChartColumn,
  Dog,
  Flame,
  House,
  MapPin,
  Medal,
  PawPrint,
  Trophy,
} from "@sketchyicons/react-native";
import { AppTab } from "./HubScreen";
import { Walk } from "../types/walk";
import { calculateWalkStreak } from "../utils/streak";
import { formatTime } from "../utils/time";

type Props = { walks: Walk[]; onStartWalk: (shareRoute: boolean) => void; onNavigate: (tab: AppTab) => void };

export function HomeScreen({ walks, onStartWalk, onNavigate }: Props) {
  const now = new Date();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [shareRoute, setShareRoute] = useState(false);
  const streak = calculateWalkStreak(walks);
  const monthWalks = walks.filter((w) => { const d = new Date(w.ended_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const distance = monthWalks.reduce((sum, w) => sum + w.distance_km, 0);
  const days = new Set(monthWalks.map((w) => new Date(w.ended_at).getDate()));
  const selectedWalks = selectedDay ? monthWalks.filter((w) => new Date(w.ended_at).getDate() === selectedDay) : [];
  const selectedDistance = selectedWalks.reduce((sum,w)=>sum+w.distance_km,0);
  const selectedSeconds = selectedWalks.reduce((sum,w)=>sum+w.duration_seconds,0);
  const first = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const count = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const cells: Array<number | null> = [...Array(first).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  const month = new Intl.DateTimeFormat("en-AU", { month: "long", year: "numeric" }).format(now);
  const askStart = () => setStartOpen(true);

  return <View style={s.screen}>
    <View style={s.header}>
      <View>
        <Text style={s.logo}>waltz</Text>
        <View style={s.streakRow}>
          <Flame size={21} strokeWidth={2} color="#E87859" />
          <Text style={s.streak}>{streak} day{streak === 1 ? "" : "s"} streak</Text>
        </View>
      </View>
      <Pressable style={s.avatar} onPress={() => onNavigate("me")}>
        <Dog size={30} strokeWidth={2} color="#332E29" />
      </Pressable>
    </View>

    <View style={s.card}>
      <Text style={s.month}>{month}</Text>
      <View style={s.week}>{["S","M","T","W","T","F","S"].map((x,i)=><Text key={i} style={s.weekText}>{x}</Text>)}</View>
      <View style={s.calendar}>{cells.map((day,i)=><Pressable disabled={!day} onPress={()=>day&&setSelectedDay(day)} key={i} style={[s.day,day===selectedDay&&s.selectedDay]}><Text style={s.dayText}>{day ?? ""}</Text>{day && days.has(day) ? <PawPrint size={10} strokeWidth={2} color="#78845C" /> : null}</Pressable>)}</View>
      {selectedDay ? <View style={s.dayDetail}><Text style={s.dayTitle}>{month.split(" ")[0]} {selectedDay}</Text>{selectedWalks.length ? <Text style={s.dayCopy}>{selectedWalks.length} walk{selectedWalks.length===1?"":"s"}  ·  {selectedDistance.toFixed(2)} km  ·  {formatTime(selectedSeconds)}</Text> : <Text style={s.dayCopy}>No walks yet. Tiny paws had a rest day 💤</Text>}</View> : null}
      <View style={s.stats}>
        <View style={s.statItem}><PawPrint size={20} strokeWidth={2} color="#78845C" /><View><Text style={s.muted}>Total walks</Text><Text style={s.value}>{monthWalks.length}</Text></View></View>
        <View style={s.statItem}><MapPin size={20} strokeWidth={2} color="#78845C" /><View><Text style={s.muted}>Total distance</Text><Text style={s.value}>{distance.toFixed(1)} km</Text></View></View>
      </View>
    </View>

    <View style={s.quick}>
      <Quick icon={<Trophy size={25} strokeWidth={2} color="#1D1A17" />} title="Leaderboard" onPress={() => onNavigate("leaderboard")} />
      <Quick icon={<ChartColumn size={25} strokeWidth={2} color="#1D1A17" />} title="Stats" onPress={() => onNavigate("stats")} />
      <Quick icon={<Medal size={25} strokeWidth={2} color="#1D1A17" />} title="Challenges" onPress={() => onNavigate("challenges")} />
    </View>

    <View style={s.nav}>
      <Nav icon={<House size={22} strokeWidth={2} color="#78845C" />} label="Home" active onPress={() => onNavigate("home")} />
      <Nav icon={<MapPin size={22} strokeWidth={2} color="#332E29" />} label="History" onPress={() => onNavigate("map")} />
      <Pressable style={s.pawButton} onPress={askStart}><PawPrint size={27} strokeWidth={2} color="#FFFDF8" /></Pressable>
      <Nav icon={<Text style={s.heart}>♡</Text>} label="Community" onPress={() => onNavigate("community")} />
      <Nav icon={<Dog size={22} strokeWidth={2} color="#332E29" />} label="Me" onPress={() => onNavigate("me")} />
    </View>

    <Modal visible={startOpen} transparent animationType="fade" onRequestClose={()=>setStartOpen(false)}>
      <View style={s.overlay}><View style={s.sheet}>
        <View style={s.sheetTitleRow}><PawPrint size={27} strokeWidth={2} color="#1D1A17" /><Text style={s.sheetTitle}>Ready for a waltz?</Text></View>
        <View style={s.shareRow}><View style={{flex:1}}><Text style={s.shareTitle}>Share this route</Text><Text style={s.shareCopy}>Friends can see the route after you save the walk. Your live location is never shared.</Text></View><Switch value={shareRoute} onValueChange={setShareRoute}/></View>
        <Pressable style={s.start} onPress={()=>{setStartOpen(false);onStartWalk(shareRoute)}}><View style={s.startContent}><PawPrint size={27} strokeWidth={2} color="#FFFDF8" /><Text style={s.startText}>START WALK</Text></View></Pressable>
        <Pressable onPress={()=>setStartOpen(false)}><Text style={s.cancel}>Cancel</Text></Pressable>
      </View></View>
    </Modal>
  </View>;
}

function Quick({icon,title,onPress}:{icon:React.ReactNode;title:string;onPress:()=>void}) { return <Pressable style={s.quickCard} onPress={onPress}>{icon}<Text style={s.quickTitle}>{title}</Text><Text style={s.muted}>Tap to explore ›</Text></Pressable>; }
function Nav({icon,label,active,onPress}:{icon:React.ReactNode;label:string;active?:boolean;onPress:()=>void}) { return <Pressable style={s.navItem} onPress={onPress}>{icon}<Text style={[s.navLabel,active&&s.active]}>{label}</Text></Pressable>; }

const s=StyleSheet.create({screen:{flex:1,justifyContent:"space-between"},header:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},logo:{fontFamily:"Schoolbell_400Regular",fontSize:52,lineHeight:56,color:"#1D1A17"},streakRow:{flexDirection:"row",alignItems:"center",gap:6},streak:{fontSize:20,fontWeight:"700",color:"#E87859"},avatar:{width:62,height:62,borderRadius:31,backgroundColor:"#F1E7D7",alignItems:"center",justifyContent:"center"},card:{backgroundColor:"#FFFDF8",borderRadius:28,padding:16},month:{textAlign:"center",fontSize:21,fontWeight:"700",marginBottom:8,color:"#2B251F"},week:{flexDirection:"row"},weekText:{width:"14.2857%",textAlign:"center",fontSize:11,color:"#756B60"},calendar:{flexDirection:"row",flexWrap:"wrap",marginTop:4},day:{width:"14.2857%",height:34,alignItems:"center",justifyContent:"center",borderRadius:12},selectedDay:{backgroundColor:"#E9E4D7"},dayText:{fontSize:13,color:"#2D2823"},dayDetail:{marginTop:8,padding:10,borderRadius:14,backgroundColor:"#F6F0E5"},dayTitle:{fontWeight:"800",fontSize:13},dayCopy:{fontSize:12,color:"#655D54",marginTop:2},stats:{borderTopWidth:1,borderTopColor:"#EEE5D7",marginTop:7,paddingTop:10,flexDirection:"row",justifyContent:"space-around"},statItem:{flexDirection:"row",alignItems:"center",gap:8},muted:{fontSize:11,color:"#756B60",marginTop:3},value:{fontSize:20,fontWeight:"800",color:"#1D1A17",marginTop:2},start:{backgroundColor:"#8C9670",borderRadius:22,paddingVertical:15,alignItems:"center"},startContent:{flexDirection:"row",alignItems:"center",gap:8},startText:{fontFamily:"Schoolbell_400Regular",color:"#FFFDF8",fontSize:25,letterSpacing:1.3},quick:{flexDirection:"row",gap:8},quickCard:{flex:1,height:105,backgroundColor:"#FFFDF8",borderRadius:20,padding:12,justifyContent:"center"},quickTitle:{fontSize:13,fontWeight:"800",color:"#1D1A17",marginTop:4},nav:{height:68,borderRadius:25,backgroundColor:"#FFFDF8",flexDirection:"row",alignItems:"center",justifyContent:"space-around"},navItem:{width:58,alignItems:"center"},navLabel:{fontSize:9,color:"#443D37",marginTop:2},active:{color:"#78845C",fontWeight:"800"},heart:{fontSize:22,color:"#332E29"},pawButton:{width:60,height:60,borderRadius:30,backgroundColor:"#89936B",alignItems:"center",justifyContent:"center",marginTop:-20},overlay:{flex:1,backgroundColor:"rgba(0,0,0,0.28)",justifyContent:"flex-end"},sheet:{backgroundColor:"#FFFDF8",padding:24,paddingBottom:38,borderTopLeftRadius:30,borderTopRightRadius:30,gap:18},sheetTitleRow:{flexDirection:"row",alignItems:"center",gap:8},sheetTitle:{fontFamily:"Schoolbell_400Regular",fontSize:30},shareRow:{flexDirection:"row",alignItems:"center",gap:14},shareTitle:{fontSize:16,fontWeight:"800"},shareCopy:{fontSize:12,color:"#756B60",marginTop:4,lineHeight:17},cancel:{textAlign:"center",fontWeight:"700",color:"#756B60"}});
