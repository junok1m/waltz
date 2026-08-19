import { useMemo,useState } from "react";
import { Pressable,ScrollView,StyleSheet,Text,View } from "react-native";
import { Walk } from "../types/walk";

type DayStat={key:string;date:Date;distance:number;seconds:number;count:number};
type Props={walks:Walk[];onOpenDay?:(dayKey:string)=>void};

function startOfDay(d:Date){return new Date(d.getFullYear(),d.getMonth(),d.getDate());}
function addDays(d:Date,n:number){const x=new Date(d);x.setDate(x.getDate()+n);return x;}
function dayKey(d:Date){return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function startOfWeek(d:Date){const x=startOfDay(d);const mondayOffset=(x.getDay()+6)%7;return addDays(x,-mondayOffset);}
function formatDuration(seconds:number){const min=Math.round(seconds/60);return min<60?`${min} min`:`${Math.floor(min/60)}h ${min%60}m`;}

export function WalkingHeatmap({walks,onOpenDay}:Props){
 const[selectedKey,setSelectedKey]=useState<string|null>(null);
 const{weeks,maxDistance,weekdayStats}=useMemo(()=>{
   const today=startOfDay(new Date());
   const endWeek=startOfWeek(today);
   const firstWeek=addDays(endWeek,-51*7);
   const stats=new Map<string,DayStat>();
   for(const w of walks){const d=startOfDay(new Date(w.ended_at));const key=dayKey(d);const current=stats.get(key)??{key,date:d,distance:0,seconds:0,count:0};current.distance+=w.distance_km;current.seconds+=w.duration_seconds;current.count+=1;stats.set(key,current);}
   const weeks:Array<Array<DayStat|null>>=[];
   let maxDistance=0;
   for(let wi=0;wi<52;wi++){
     const weekStart=addDays(firstWeek,wi*7);const week:Array<DayStat|null>=[];
     for(let di=0;di<7;di++){
       const d=addDays(weekStart,di);if(d>today){week.push(null);continue;}
       const key=dayKey(d);const stat=stats.get(key)??{key,date:d,distance:0,seconds:0,count:0};
       maxDistance=Math.max(maxDistance,stat.distance);week.push(stat);
     }
     weeks.push(week);
   }
   const weekdayStats=Array.from({length:7},(_,i)=>{const matching=[...stats.values()].filter(s=>((s.date.getDay()+6)%7)===i&&s.date>=firstWeek&&s.date<=today);const activeDays=matching.filter(s=>s.count>0);return{label:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i],avg:activeDays.length?activeDays.reduce((sum,s)=>sum+s.distance,0)/activeDays.length:0,total:matching.reduce((sum,s)=>sum+s.distance,0)};});
   return{weeks,maxDistance,weekdayStats};
 },[walks]);
 const selected=weeks.flat().find(d=>d?.key===selectedKey)??null;
 const busiest=weekdayStats.reduce((best,x)=>x.avg>best.avg?x:best,weekdayStats[0]);
 function shade(distance:number){if(distance<=0)return"#EEE8DD";const ratio=maxDistance?distance/maxDistance:0;if(ratio<.25)return"#DDE3CF";if(ratio<.5)return"#C1CCAA";if(ratio<.75)return"#A4B184";return"#78845C";}
 function pressDay(day:DayStat){if(selectedKey===day.key&&day.count>0&&onOpenDay){onOpenDay(day.key);return;}setSelectedKey(day.key);}
 return <View style={s.card}>
   <View style={s.header}><View><Text style={s.eyebrow}>CONSISTENCY</Text><Text style={s.title}>A year of waltzes</Text></View><View style={s.legend}><Text style={s.legendText}>less</Text>{["#EEE8DD","#DDE3CF","#C1CCAA","#A4B184","#78845C"].map(c=><View key={c} style={[s.legendCell,{backgroundColor:c}]}/>) }<Text style={s.legendText}>more</Text></View></View>
   {selected?<View style={s.tooltip}><Text style={s.tooltipTitle}>{selected.date.toLocaleDateString("en-AU",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}</Text><Text style={s.tooltipMain}>{selected.distance.toFixed(2)} km</Text><Text style={s.tooltipMeta}>{selected.count} waltz{selected.count===1?"":"es"} · {formatDuration(selected.seconds)}</Text>{selected.count>0?<Text style={s.tapAgain}>Tap this square again to open the day ›</Text>:null}</View>:<Text style={s.hint}>Tap a square to inspect the day.</Text>}
   <View style={s.heatmapRow}><View style={s.dayLabels}>{["M","","W","","F","","S"].map((x,i)=><Text key={i} style={s.dayLabel}>{x}</Text>)}</View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.weeks}>{weeks.map((week,wi)=><View key={wi} style={s.week}>{week.map((day,di)=>day?<Pressable key={day.key} onPress={()=>pressDay(day)} style={[s.cell,{backgroundColor:shade(day.distance)},day.key===selectedKey&&s.selectedCell]}/>:<View key={`empty-${di}`} style={[s.cell,s.futureCell]}/>)}</View>)}</ScrollView></View>
   <View style={s.weekdayCard}><Text style={s.weekdayTitle}>Weekday pattern</Text><Text style={s.weekdayCopy}>{busiest.avg>0?`${busiest.label} is your biggest walking day · ${busiest.avg.toFixed(1)} km average on active ${busiest.label}s.`:"Walk a little more and your weekly rhythm will appear here."}</Text><View style={s.weekdayBars}>{weekdayStats.map(x=>{const maxAvg=Math.max(...weekdayStats.map(y=>y.avg),.01);return <View key={x.label} style={s.weekdayItem}><View style={s.weekdayTrack}><View style={[s.weekdayFill,{height:`${Math.max(6,(x.avg/maxAvg)*100)}%`}]} /></View><Text style={s.weekdayLabel}>{x.label[0]}</Text></View>})}</View></View>
 </View>;
}

const s=StyleSheet.create({card:{backgroundColor:"#FFFDF8",borderRadius:24,padding:16,gap:12},header:{gap:8},eyebrow:{fontSize:9,fontWeight:"900",color:"#9A9187",letterSpacing:1.1},title:{fontFamily:"Schoolbell_400Regular",fontSize:27,color:"#1D1A17",marginTop:2},legend:{flexDirection:"row",alignItems:"center",gap:4},legendText:{fontSize:8,color:"#9A9187"},legendCell:{width:11,height:11,borderRadius:3},hint:{fontSize:11,color:"#9A9187",paddingVertical:8},tooltip:{backgroundColor:"#F6F0E5",borderRadius:15,padding:10},tooltipTitle:{fontSize:10,fontWeight:"900",color:"#655D54"},tooltipMain:{fontSize:20,fontWeight:"900",color:"#1D1A17",marginTop:2},tooltipMeta:{fontSize:10,color:"#756B60",marginTop:1},tapAgain:{fontSize:9,fontWeight:"800",color:"#78845C",marginTop:4},heatmapRow:{flexDirection:"row",gap:6},dayLabels:{paddingTop:1},dayLabel:{height:13,fontSize:8,color:"#9A9187",textAlign:"center",width:10},weeks:{gap:3,paddingRight:4},week:{gap:3},cell:{width:10,height:10,borderRadius:3},futureCell:{backgroundColor:"transparent"},selectedCell:{borderWidth:1.5,borderColor:"#332E29"},weekdayCard:{backgroundColor:"#F6F0E5",borderRadius:17,padding:12},weekdayTitle:{fontSize:12,fontWeight:"900",color:"#332E29"},weekdayCopy:{fontSize:10,color:"#756B60",marginTop:3,lineHeight:15},weekdayBars:{height:68,flexDirection:"row",alignItems:"flex-end",justifyContent:"space-between",marginTop:10},weekdayItem:{alignItems:"center",gap:4,width:"12%"},weekdayTrack:{height:48,width:18,backgroundColor:"#E8E0D4",borderRadius:6,justifyContent:"flex-end",overflow:"hidden"},weekdayFill:{width:"100%",backgroundColor:"#8C9670",borderRadius:6},weekdayLabel:{fontSize:9,fontWeight:"800",color:"#756B60"}});
