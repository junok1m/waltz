import { useMemo,useState } from "react";
import { Pressable,StyleSheet,Text,View } from "react-native";
import Svg,{Circle} from "react-native-svg";
import { Walk } from "../types/walk";

type Mode="time"|"waltzes";
type Slice={label:string;seconds:number;count:number;color:string};
type Props={walks:Walk[]};

const DONUT_SIZE=150;
const STROKE=22;
const RADIUS=(DONUT_SIZE-STROKE)/2;
const CIRCUMFERENCE=2*Math.PI*RADIUS;

function formatDuration(seconds:number){const min=Math.round(seconds/60);return min<60?`${min} min`:`${Math.floor(min/60)}h ${min%60}m`;}

export function WaltzTimePattern({walks}:Props){
 const[mode,setMode]=useState<Mode>("time");
 const slices=useMemo(()=>{
   const base:Record<string,Slice>={
     Morning:{label:"Morning",seconds:0,count:0,color:"#8C9670"},
     Afternoon:{label:"Afternoon",seconds:0,count:0,color:"#C9BBA7"},
     Evening:{label:"Evening",seconds:0,count:0,color:"#A7A8A0"},
   };
   for(const w of walks){const h=new Date(w.ended_at).getHours();const key=h<12?"Morning":h<18?"Afternoon":"Evening";base[key].seconds+=w.duration_seconds;base[key].count+=1;}
   return [base.Morning,base.Afternoon,base.Evening];
 },[walks]);
 const values=slices.map(x=>mode==="time"?x.seconds:x.count);
 const total=values.reduce((sum,value)=>sum+value,0);
 const biggestIndex=values.reduce((best,v,i)=>v>values[best]?i:best,0),biggest=slices[biggestIndex];
 let progress=0;
 return <View style={s.card}>
   <View style={s.topRow}><View><Text style={s.eyebrow}>RHYTHM</Text><Text style={s.title}>When do we waltz?</Text></View><View style={s.toggle}>{(["time","waltzes"] as Mode[]).map(x=><Pressable key={x} style={[s.toggleItem,mode===x&&s.toggleActive]} onPress={()=>setMode(x)}><Text style={[s.toggleText,mode===x&&s.toggleTextActive]}>{x==="time"?"Time":"Waltzes"}</Text></Pressable>)}</View></View>
   {total>0?<Text style={s.summary}>{biggest.label} is your biggest waltz window.</Text>:<Text style={s.summary}>Your daily rhythm will appear after a few waltzes.</Text>}
   <View style={s.chartRow}>
     <View style={s.donutWrap}>
       <Svg width={DONUT_SIZE} height={DONUT_SIZE} viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}>
         <Circle cx={DONUT_SIZE/2} cy={DONUT_SIZE/2} r={RADIUS} fill="none" stroke="#EEE8DD" strokeWidth={STROKE}/>
         {slices.map((slice,i)=>{const pct=total?values[i]/total:0;const dash=pct*CIRCUMFERENCE;const offset=-progress*CIRCUMFERENCE;progress+=pct;return <Circle key={slice.label} cx={DONUT_SIZE/2} cy={DONUT_SIZE/2} r={RADIUS} fill="none" stroke={slice.color} strokeWidth={STROKE} strokeDasharray={`${dash} ${CIRCUMFERENCE-dash}`} strokeDashoffset={offset} strokeLinecap="butt" rotation={-90} origin={`${DONUT_SIZE/2}, ${DONUT_SIZE/2}`}/>})}
       </Svg>
       <View style={s.donutCenter}><Text style={s.centerLabel}>{total?biggest.label:"Waiting"}</Text><Text style={s.centerValue}>{total?`${Math.round(values[biggestIndex]/total*100)}%`:"0%"}</Text></View>
     </View>
     <View style={s.legend}>{slices.map((slice,i)=>{const pct=total?values[i]/total:0;return <View key={slice.label} style={s.legendItem}><View style={s.legendTop}><View style={[s.dot,{backgroundColor:slice.color}]}/><Text style={s.legendLabel}>{slice.label}</Text><Text style={s.legendPct}>{Math.round(pct*100)}%</Text></View><Text style={s.legendValue}>{mode==="time"?formatDuration(slice.seconds):`${slice.count} waltz${slice.count===1?"":"es"}`}</Text></View>})}</View>
   </View>
   <Text style={s.note}>Morning before 12 · Afternoon 12–6 · Evening after 6</Text>
 </View>;
}

const s=StyleSheet.create({card:{backgroundColor:"#FFFDF8",borderRadius:24,padding:16,gap:13},topRow:{gap:10},eyebrow:{fontSize:9,fontWeight:"900",color:"#9A9187",letterSpacing:1.1},title:{fontFamily:"Schoolbell_400Regular",fontSize:27,color:"#1D1A17",marginTop:2},toggle:{alignSelf:"flex-start",flexDirection:"row",backgroundColor:"#F1E7D7",borderRadius:999,padding:3},toggleItem:{paddingHorizontal:14,paddingVertical:6,borderRadius:999},toggleActive:{backgroundColor:"#8C9670"},toggleText:{fontSize:10,fontWeight:"800",color:"#82786E"},toggleTextActive:{color:"#FFFDF8"},summary:{fontSize:12,fontWeight:"700",color:"#655D54"},chartRow:{flexDirection:"row",alignItems:"center",gap:18},donutWrap:{width:DONUT_SIZE,height:DONUT_SIZE,alignItems:"center",justifyContent:"center"},donutCenter:{position:"absolute",alignItems:"center"},centerLabel:{fontSize:11,fontWeight:"800",color:"#655D54"},centerValue:{fontFamily:"Schoolbell_400Regular",fontSize:29,color:"#1D1A17",marginTop:-2},legend:{flex:1,gap:12},legendItem:{gap:2},legendTop:{flexDirection:"row",alignItems:"center",gap:6},dot:{width:9,height:9,borderRadius:5},legendLabel:{fontSize:11,fontWeight:"900",color:"#332E29",flex:1},legendPct:{fontSize:10,fontWeight:"800",color:"#756B60"},legendValue:{fontSize:9,color:"#9A9187",paddingLeft:15},note:{fontSize:8,color:"#A99F93"}});