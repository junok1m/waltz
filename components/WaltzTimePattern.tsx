import { useMemo,useState } from "react";
import { Pressable,StyleSheet,Text,View } from "react-native";
import { Walk } from "../types/walk";

type Mode="time"|"waltzes";
type Slice={label:string;value:number;seconds:number;count:number};
type Props={walks:Walk[]};

function formatDuration(seconds:number){const min=Math.round(seconds/60);return min<60?`${min} min`:`${Math.floor(min/60)}h ${min%60}m`;}

export function WaltzTimePattern({walks}:Props){
 const[mode,setMode]=useState<Mode>("time");
 const slices=useMemo(()=>{
   const base:Record<string,Slice>={Morning:{label:"Morning",value:0,seconds:0,count:0},Afternoon:{label:"Afternoon",value:0,seconds:0,count:0},Evening:{label:"Evening",value:0,seconds:0,count:0}};
   for(const w of walks){const h=new Date(w.ended_at).getHours();const key=h<12?"Morning":h<18?"Afternoon":"Evening";base[key].seconds+=w.duration_seconds;base[key].count+=1;}
   return [base.Morning,base.Afternoon,base.Evening];
 },[walks]);
 const total=mode==="time"?slices.reduce((s,x)=>s+x.seconds,0):slices.reduce((s,x)=>s+x.count,0);
 const values=slices.map(x=>mode==="time"?x.seconds:x.count);
 const biggestIndex=values.reduce((best,v,i)=>v>values[best]?i:best,0),biggest=slices[biggestIndex];
 return <View style={s.card}>
   <View style={s.topRow}><View><Text style={s.eyebrow}>RHYTHM</Text><Text style={s.title}>When do we waltz?</Text></View><View style={s.toggle}>{(["time","waltzes"] as Mode[]).map(x=><Pressable key={x} style={[s.toggleItem,mode===x&&s.toggleActive]} onPress={()=>setMode(x)}><Text style={[s.toggleText,mode===x&&s.toggleTextActive]}>{x==="time"?"Time":"Waltzes"}</Text></Pressable>)}</View></View>
   {total>0?<Text style={s.summary}>{biggest.label} is your biggest waltz window.</Text>:<Text style={s.summary}>Your daily rhythm will appear after a few waltzes.</Text>}
   <View style={s.rows}>{slices.map((x,i)=>{const value=values[i],pct=total?value/total:0;return <View key={x.label} style={s.row}><View style={s.labelRow}><Text style={s.label}>{x.label}</Text><Text style={s.value}>{Math.round(pct*100)}% · {mode==="time"?formatDuration(x.seconds):`${x.count} waltz${x.count===1?"":"es"}`}</Text></View><View style={s.track}><View style={[s.fill,{width:`${Math.max(pct*100,value>0?5:0)}%`}]} /></View></View>})}</View>
   <Text style={s.note}>Morning before 12 · Afternoon 12–6 · Evening after 6</Text>
 </View>;
}

const s=StyleSheet.create({card:{backgroundColor:"#FFFDF8",borderRadius:24,padding:16,gap:13},topRow:{gap:10},eyebrow:{fontSize:9,fontWeight:"900",color:"#9A9187",letterSpacing:1.1},title:{fontFamily:"Schoolbell_400Regular",fontSize:27,color:"#1D1A17",marginTop:2},toggle:{alignSelf:"flex-start",flexDirection:"row",backgroundColor:"#F1E7D7",borderRadius:999,padding:3},toggleItem:{paddingHorizontal:14,paddingVertical:6,borderRadius:999},toggleActive:{backgroundColor:"#8C9670"},toggleText:{fontSize:10,fontWeight:"800",color:"#82786E"},toggleTextActive:{color:"#FFFDF8"},summary:{fontSize:12,fontWeight:"700",color:"#655D54"},rows:{gap:12},row:{gap:5},labelRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",gap:10},label:{fontSize:12,fontWeight:"900",color:"#332E29"},value:{fontSize:10,color:"#756B60"},track:{height:17,borderRadius:999,backgroundColor:"#EEE8DD",overflow:"hidden"},fill:{height:"100%",borderRadius:999,backgroundColor:"#8C9670"},note:{fontSize:8,color:"#A99F93"}});