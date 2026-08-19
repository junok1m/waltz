import { useEffect,useMemo,useState } from "react";
import { Modal,Pressable,ScrollView,StyleSheet,Text,View } from "react-native";
import { Walk } from "../types/walk";

type Metric="distance"|"time"|"waltzes";
type Period="30D"|"3M"|"6M"|"1Y";
type Group="day"|"week"|"month";
type Bucket={key:string;start:Date;end:Date;walks:Walk[];distance:number;seconds:number;count:number};
type Props={walks:Walk[];onOpenDay?:(dayKey:string)=>void};

function startOfDay(d:Date){return new Date(d.getFullYear(),d.getMonth(),d.getDate());}
function addDays(d:Date,n:number){const x=new Date(d);x.setDate(x.getDate()+n);return x;}
function addMonths(d:Date,n:number){const x=new Date(d);x.setMonth(x.getMonth()+n);return x;}
function startOfWeek(d:Date){const x=startOfDay(d);const day=(x.getDay()+6)%7;return addDays(x,-day);}
function startOfMonth(d:Date){return new Date(d.getFullYear(),d.getMonth(),1);}
function dayKey(d:Date){return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function automaticGroup(period:Period):Group{return period==="30D"?"day":period==="1Y"?"month":"week";}
function rangeStart(period:Period,now:Date){const today=startOfDay(now);if(period==="30D")return addDays(today,-29);if(period==="3M")return addMonths(today,-3);if(period==="6M")return addMonths(today,-6);return addMonths(today,-12);}
function groupStart(d:Date,group:Group){return group==="day"?startOfDay(d):group==="week"?startOfWeek(d):startOfMonth(d);}
function nextGroup(d:Date,group:Group){return group==="day"?addDays(d,1):group==="week"?addDays(d,7):addMonths(d,1);}
function bucketLabel(b:Bucket,group:Group){if(group==="day")return new Intl.DateTimeFormat("en-AU",{day:"numeric",month:"short"}).format(b.start);if(group==="week")return new Intl.DateTimeFormat("en-AU",{day:"numeric",month:"short"}).format(b.start);return new Intl.DateTimeFormat("en-AU",{month:"short"}).format(b.start);}
function bucketTitle(b:Bucket,group:Group){if(group==="day")return new Intl.DateTimeFormat("en-AU",{day:"numeric",month:"short"}).format(b.start).toUpperCase();if(group==="week")return`WEEK OF ${new Intl.DateTimeFormat("en-AU",{day:"numeric",month:"short"}).format(b.start).toUpperCase()}`;return new Intl.DateTimeFormat("en-AU",{month:"long",year:"numeric"}).format(b.start).toUpperCase();}
function metricValue(b:Bucket,metric:Metric){return metric==="distance"?b.distance:metric==="time"?b.seconds/60:b.count;}
function metricName(metric:Metric){return metric==="distance"?"Distance":metric==="time"?"Time":"Waltzes";}
function metricUnit(metric:Metric){return metric==="distance"?"km":metric==="time"?"min":"";}
function metricValueText(value:number,metric:Metric){if(metric==="distance")return`${value.toFixed(value<10?1:0)} km`;if(metric==="time")return value>=60?`${(value/60).toFixed(1)} h`:`${Math.round(value)} min`;return`${Math.round(value)}`;}

export function DistanceOverTimeChart({walks,onOpenDay}:Props){
 const[metric,setMetric]=useState<Metric>("distance"),[period,setPeriod]=useState<Period>("30D"),[group,setGroup]=useState<Group>("day"),[groupWasManual,setGroupWasManual]=useState(false),[picker,setPicker]=useState<"metric"|"group"|null>(null),[selectedKey,setSelectedKey]=useState<string|null>(null);
 useEffect(()=>{if(!groupWasManual)setGroup(automaticGroup(period));},[period,groupWasManual]);
 useEffect(()=>setSelectedKey(null),[metric,period,group]);
 const buckets=useMemo(()=>{
   const now=new Date(),from=rangeStart(period,now),to=addDays(startOfDay(now),1);let cursor=groupStart(from,group);const result:Bucket[]=[];
   while(cursor<to){const next=nextGroup(cursor,group);result.push({key:`${group}-${cursor.getTime()}`,start:new Date(cursor),end:next,walks:[],distance:0,seconds:0,count:0});cursor=next;}
   for(const w of walks){const d=new Date(w.ended_at);if(d<from||d>=to)continue;const b=result.find(x=>d>=x.start&&d<x.end);if(!b)continue;b.walks.push(w);b.distance+=w.distance_km;b.seconds+=w.duration_seconds;b.count+=1;}
   return result;
 },[walks,period,group]);
 const max=Math.max(...buckets.map(b=>metricValue(b,metric)),0.0001),selected=buckets.find(b=>b.key===selectedKey)??null;
 const dense=buckets.length>45;
 const labelEvery=Math.max(1,Math.ceil(buckets.length/5));
 function pressBucket(b:Bucket){if(selectedKey===b.key&&group==="day"&&onOpenDay){onOpenDay(dayKey(b.start));return;}setSelectedKey(b.key);}
 const barsContent=<View style={[s.bars,dense&&s.barsDense]}><View style={s.baseline}/>{buckets.map((b,i)=>{const value=metricValue(b,metric),height=value<=0?2:Math.max(6,(value/max)*122),selectedBar=b.key===selectedKey;const showLabel=i===0||i===buckets.length-1||i%labelEvery===0;return <Pressable key={b.key} onPress={()=>pressBucket(b)} style={[s.barCell,dense?s.barCellDense:s.barCellFit]}><View style={s.barArea}><View style={[s.bar,{height,opacity:value<=0?.11:selectedBar?1:.78},selectedBar&&s.selectedBar]}/></View><Text numberOfLines={1} style={s.xLabel}>{showLabel?bucketLabel(b,group):""}</Text></Pressable>})}</View>;
 return <View style={s.card}>
   <View style={s.topRow}><View><Text style={s.eyebrow}>OVER TIME</Text><Pressable style={s.selector} onPress={()=>setPicker("metric")}><Text style={s.selectorText}>{metricName(metric)}⌄</Text></Pressable></View><View style={s.groupWrap}><Text style={s.groupLabel}>Group by</Text><Pressable style={s.selectorSmall} onPress={()=>setPicker("group")}><Text style={s.selectorSmallText}>{group[0].toUpperCase()+group.slice(1)}⌄</Text></Pressable></View></View>
   {selected?<View style={s.tooltip}><Text style={s.tooltipTitle}>{bucketTitle(selected,group)}</Text><Text style={s.tooltipMain}>{selected.distance.toFixed(2)} km</Text><Text style={s.tooltipMeta}>{selected.count} waltz{selected.count===1?"":"es"} · {Math.round(selected.seconds/60)} min</Text>{group==="day"?<Text style={s.tapAgain}>Tap this bar again to open the day ›</Text>:null}</View>:<View style={s.tooltipPlaceholder}><Text style={s.placeholderText}>Tap a bar to inspect it.</Text></View>}
   <View style={s.chartRow}><View style={s.yAxis}><Text style={s.yTop}>{metricValueText(max,metric)}</Text><Text style={s.yBottom}>0 {metricUnit(metric)}</Text></View><View style={s.chartBody}>{dense?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.denseScroll}>{barsContent}</ScrollView>:barsContent}</View></View>
   <View style={s.periods}>{(["30D","3M","6M","1Y"] as Period[]).map(p=><Pressable key={p} onPress={()=>{setPeriod(p);setGroupWasManual(false)}} style={[s.period,p===period&&s.periodActive]}><Text style={[s.periodText,p===period&&s.periodTextActive]}>{p}</Text></Pressable>)}</View>
   <Modal visible={picker!==null} transparent animationType="fade" onRequestClose={()=>setPicker(null)}><Pressable style={s.overlay} onPress={()=>setPicker(null)}><View style={s.menu}>{picker==="metric"?<>{(["distance","time","waltzes"] as Metric[]).map(x=><Pressable key={x} style={s.menuItem} onPress={()=>{setMetric(x);setPicker(null)}}><Text style={[s.menuText,x===metric&&s.menuActive]}>{metricName(x)}</Text></Pressable>)}</>:<>{(["day","week","month"] as Group[]).map(x=><Pressable key={x} style={s.menuItem} onPress={()=>{setGroup(x);setGroupWasManual(true);setPicker(null)}}><Text style={[s.menuText,x===group&&s.menuActive]}>{x[0].toUpperCase()+x.slice(1)}</Text></Pressable>)}</>}</View></Pressable></Modal>
 </View>;
}
const s=StyleSheet.create({card:{backgroundColor:"#FFFDF8",borderRadius:24,padding:16,gap:10},topRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-end"},eyebrow:{fontSize:9,fontWeight:"900",color:"#9A9187",letterSpacing:1.1},selector:{marginTop:3},selectorText:{fontFamily:"Schoolbell_400Regular",fontSize:28,color:"#1D1A17"},groupWrap:{alignItems:"flex-end"},groupLabel:{fontSize:9,color:"#9A9187"},selectorSmall:{marginTop:2,backgroundColor:"#F1E7D7",borderRadius:999,paddingHorizontal:10,paddingVertical:5},selectorSmallText:{fontSize:11,fontWeight:"800",color:"#655D54"},tooltip:{backgroundColor:"#F6F0E5",borderRadius:15,padding:10},tooltipPlaceholder:{height:61,justifyContent:"center",paddingHorizontal:4},placeholderText:{fontSize:11,color:"#9A9187"},tooltipTitle:{fontSize:10,fontWeight:"900",color:"#655D54"},tooltipMain:{fontSize:20,fontWeight:"900",color:"#1D1A17",marginTop:2},tooltipMeta:{fontSize:10,color:"#756B60",marginTop:1},tapAgain:{fontSize:9,fontWeight:"800",color:"#78845C",marginTop:4},chartRow:{height:168,flexDirection:"row"},yAxis:{width:45,justifyContent:"space-between",paddingBottom:25,paddingTop:2},yTop:{fontSize:9,color:"#82786E"},yBottom:{fontSize:8,color:"#A99F93"},chartBody:{flex:1,height:168,overflow:"hidden"},bars:{height:168,flex:1,position:"relative",flexDirection:"row",alignItems:"flex-end"},barsDense:{flex:0},denseScroll:{minWidth:"100%"},baseline:{position:"absolute",left:0,right:0,bottom:24,height:1,backgroundColor:"#DDD4C6"},barCell:{height:168,alignItems:"center",justifyContent:"flex-end"},barCellFit:{flex:1,minWidth:0},barCellDense:{width:10},barArea:{height:128,justifyContent:"flex-end",width:"100%",alignItems:"center"},bar:{width:"64%",minWidth:3,maxWidth:22,backgroundColor:"#8C9670",borderTopLeftRadius:4,borderTopRightRadius:4},selectedBar:{backgroundColor:"#596442"},xLabel:{height:24,fontSize:8,color:"#9A9187",paddingTop:5,textAlign:"center",width:42},periods:{flexDirection:"row",backgroundColor:"#F1E7D7",borderRadius:999,padding:3},period:{flex:1,alignItems:"center",paddingVertical:7,borderRadius:999},periodActive:{backgroundColor:"#8C9670"},periodText:{fontSize:10,fontWeight:"800",color:"#82786E"},periodTextActive:{color:"#FFFDF8"},overlay:{flex:1,backgroundColor:"rgba(0,0,0,.2)",justifyContent:"center",padding:44},menu:{backgroundColor:"#FFFDF8",borderRadius:22,padding:8},menuItem:{paddingVertical:14,paddingHorizontal:16,borderRadius:14},menuText:{fontSize:16,fontWeight:"700",color:"#655D54"},menuActive:{color:"#78845C"}});