import { useMemo } from "react";
import { StyleSheet,Text,View } from "react-native";
import { Walk } from "../types/walk";

type Props={walks:Walk[]};
function dayKey(date:string){const d=new Date(date);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function monthKey(date:string){const d=new Date(date);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;}
function monthLabel(key:string){const[y,m]=key.split("-").map(Number);return new Intl.DateTimeFormat("en-AU",{month:"short",year:"numeric"}).format(new Date(y,m-1,1));}
function bestStreak(walks:Walk[]){const days=[...new Set(walks.map(w=>dayKey(w.ended_at)))].sort();let best=0,current=0,prev:number|null=null;for(const key of days){const[y,m,d]=key.split("-").map(Number),n=new Date(y,m-1,d).getTime()/86400000;current=prev!==null&&n-prev===1?current+1:1;best=Math.max(best,current);prev=n;}return best;}

export function PersonalRecords({walks}:Props){
 const records=useMemo(()=>{
  if(!walks.length)return[];
  const longest=[...walks].sort((a,b)=>b.distance_km-a.distance_km)[0];
  const days=new Map<string,{distance:number,count:number}>();
  const months=new Map<string,number>();
  for(const w of walks){const d=dayKey(w.ended_at),m=monthKey(w.ended_at);const ds=days.get(d)??{distance:0,count:0};ds.distance+=w.distance_km;ds.count+=1;days.set(d,ds);months.set(m,(months.get(m)??0)+w.distance_km);}
  const biggestDay=[...days.entries()].sort((a,b)=>b[1].distance-a[1].distance)[0];
  const mostWalks=[...days.entries()].sort((a,b)=>b[1].count-a[1].count)[0];
  const biggestMonth=[...months.entries()].sort((a,b)=>b[1]-a[1])[0];
  return[
   {label:"Longest waltz",value:`${longest.distance_km.toFixed(1)} km`,detail:new Date(longest.ended_at).toLocaleDateString("en-AU",{day:"numeric",month:"short"})},
   {label:"Longest walking day",value:`${biggestDay[1].distance.toFixed(1)} km`,detail:new Date(`${biggestDay[0]}T12:00:00`).toLocaleDateString("en-AU",{day:"numeric",month:"short"})},
   {label:"Most waltzes in a day",value:`${mostWalks[1].count}`,detail:new Date(`${mostWalks[0]}T12:00:00`).toLocaleDateString("en-AU",{day:"numeric",month:"short"})},
   {label:"Longest streak",value:`${bestStreak(walks)} days`,detail:"personal best"},
   {label:"Biggest month",value:`${biggestMonth[1].toFixed(1)} km`,detail:monthLabel(biggestMonth[0])},
  ];
 },[walks]);
 return <View style={s.card}><Text style={s.eyebrow}>PERSONAL RECORDS</Text><Text style={s.title}>Hall of fame</Text>{records.length? <View style={s.grid}>{records.map((r,i)=><View key={r.label} style={[s.record,i===0&&s.hero]}><Text style={s.label}>{r.label}</Text><Text style={[s.value,i===0&&s.heroValue]}>{r.value}</Text><Text style={s.detail}>{r.detail}</Text></View>)}</View>:<Text style={s.empty}>Your records will appear after your first waltz.</Text>}</View>;
}
const s=StyleSheet.create({card:{backgroundColor:"#FFFDF8",borderRadius:24,padding:16,gap:10},eyebrow:{fontSize:9,fontWeight:"900",color:"#9A9187",letterSpacing:1.1},title:{fontFamily:"Schoolbell_400Regular",fontSize:27,color:"#1D1A17"},grid:{flexDirection:"row",flexWrap:"wrap",gap:8},record:{width:"48%",backgroundColor:"#F6F0E5",borderRadius:17,padding:12,minHeight:88},hero:{width:"100%",backgroundColor:"#E8EEDB"},label:{fontSize:9,fontWeight:"800",color:"#756B60"},value:{fontSize:20,fontWeight:"900",color:"#1D1A17",marginTop:4},heroValue:{fontSize:28},detail:{fontSize:9,color:"#9A9187",marginTop:3},empty:{fontSize:11,color:"#9A9187"}});