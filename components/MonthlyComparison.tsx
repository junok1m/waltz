import { useMemo } from "react";
import { StyleSheet,Text,View } from "react-native";
import { Walk } from "../types/walk";

type Props={walks:Walk[]};
function monthKey(d:Date){return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;}
function label(d:Date){return new Intl.DateTimeFormat("en-AU",{month:"short"}).format(d).toUpperCase();}
function duration(seconds:number){const min=Math.round(seconds/60);return min<60?`${min}m`:`${Math.floor(min/60)}h ${min%60}m`;}

export function MonthlyComparison({walks}:Props){
 const data=useMemo(()=>{
  const now=new Date(),currentStart=new Date(now.getFullYear(),now.getMonth(),1),previousStart=new Date(now.getFullYear(),now.getMonth()-1,1);
  const currentKey=monthKey(currentStart),previousKey=monthKey(previousStart);
  function sum(key:string){const ws=walks.filter(w=>monthKey(new Date(w.ended_at))===key);return{walks:ws.length,km:ws.reduce((s,w)=>s+w.distance_km,0),seconds:ws.reduce((s,w)=>s+w.duration_seconds,0)};}
  return{current:sum(currentKey),previous:sum(previousKey),currentLabel:label(currentStart),previousLabel:label(previousStart)};
 },[walks]);
 const delta=data.previous.km>0?((data.current.km-data.previous.km)/data.previous.km)*100:null;
 const message=delta===null?"A second month of data will unlock the comparison.":delta===0?"Exactly the same distance as last month.":`${Math.abs(delta).toFixed(0)}% ${delta>0?"more":"less"} distance than last month.`;
 return <View style={s.card}><Text style={s.eyebrow}>MONTHLY COMPARISON</Text><Text style={s.title}>This month vs last month</Text><View style={s.columns}><View style={s.column}><Text style={s.month}>{data.previousLabel}</Text><Text style={s.km}>{data.previous.km.toFixed(1)} km</Text><Text style={s.meta}>{data.previous.walks} waltzes</Text><Text style={s.meta}>{duration(data.previous.seconds)}</Text></View><View style={s.divider}/><View style={s.column}><Text style={s.month}>{data.currentLabel}</Text><Text style={s.km}>{data.current.km.toFixed(1)} km</Text><Text style={s.meta}>{data.current.walks} waltzes</Text><Text style={s.meta}>{duration(data.current.seconds)}</Text></View></View><View style={s.insight}><Text style={s.arrow}>{delta===null?"·":delta>=0?"↗":"↘"}</Text><Text style={s.insightText}>{message}</Text></View></View>;
}
const s=StyleSheet.create({card:{backgroundColor:"#FFFDF8",borderRadius:24,padding:16,gap:12},eyebrow:{fontSize:9,fontWeight:"900",color:"#9A9187",letterSpacing:1.1},title:{fontFamily:"Schoolbell_400Regular",fontSize:27,color:"#1D1A17"},columns:{flexDirection:"row",alignItems:"stretch",backgroundColor:"#F6F0E5",borderRadius:18,padding:14},column:{flex:1},divider:{width:1,backgroundColor:"#DED5C8",marginHorizontal:14},month:{fontSize:10,fontWeight:"900",color:"#8A8176"},km:{fontSize:24,fontWeight:"900",color:"#1D1A17",marginTop:4},meta:{fontSize:10,color:"#756B60",marginTop:2},insight:{flexDirection:"row",alignItems:"center",gap:8,backgroundColor:"#E8EEDB",borderRadius:15,padding:11},arrow:{fontSize:22,fontWeight:"900",color:"#78845C"},insightText:{flex:1,fontSize:11,fontWeight:"700",color:"#596442"}});