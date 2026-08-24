import { useMemo } from "react";
import { StyleSheet,Text,View } from "react-native";
import { Walk } from "../types/walk";

type Props={walks:Walk[]};

function personality(shared:number,total:number){if(total===0)return{title:"No trail yet",copy:"Your route-sharing personality will appear here."};const ratio=shared/total;if(ratio>=.65)return{title:"Pathfinder™",copy:"You usually let your finished routes out into the world."};if(ratio<=.35)return{title:"Hermit Walker™",copy:"Most routes stay between you and your dog."};return{title:"Selective Sniffer™",copy:"Some routes get shared. Others remain classified."};}

export function RoutePrivacyPersonality({walks}:Props){
 const data=useMemo(()=>{const shared=walks.filter(w=>w.share_route).length,hidden=walks.length-shared,total=walks.length;return{shared,hidden,total,...personality(shared,total)};},[walks]);
 const sharedPct=data.total?data.shared/data.total:0,hiddenPct=data.total?data.hidden/data.total:0;
 return <View style={s.card}>
   <Text style={s.eyebrow}>ROUTE PERSONALITY</Text>
   <Text style={s.title}>{data.title}</Text>
   <Text style={s.copy}>{data.copy}</Text>
   <View style={s.rows}>
     <View style={s.row}><View style={s.labelRow}><Text style={s.label}>Hidden</Text><Text style={s.value}>{data.hidden} walks · {Math.round(hiddenPct*100)}%</Text></View><View style={s.track}><View style={[s.hiddenFill,{width:`${hiddenPct*100}%`}]} /></View></View>
     <View style={s.row}><View style={s.labelRow}><Text style={s.label}>Shared</Text><Text style={s.value}>{data.shared} walks · {Math.round(sharedPct*100)}%</Text></View><View style={s.track}><View style={[s.sharedFill,{width:`${sharedPct*100}%`}]} /></View></View>
   </View>
   <Text style={s.note}>Based on completed waltzes only. Live location is never part of this.</Text>
 </View>;
}

const s=StyleSheet.create({card:{backgroundColor:"#FFFDF8",borderRadius:24,padding:16,gap:11},eyebrow:{fontSize:9,fontWeight:"900",color:"#9A9187",letterSpacing:1.1},title:{fontFamily:"Schoolbell_400Regular",fontSize:29,color:"#1D1A17"},copy:{fontSize:11,color:"#756B60",lineHeight:16},rows:{gap:13,marginTop:2},row:{gap:5},labelRow:{flexDirection:"row",justifyContent:"space-between",gap:10},label:{fontSize:12,fontWeight:"900",color:"#332E29"},value:{fontSize:10,color:"#756B60"},track:{height:18,borderRadius:999,backgroundColor:"#EEE8DD",overflow:"hidden"},hiddenFill:{height:"100%",borderRadius:999,backgroundColor:"#C7BBAA"},sharedFill:{height:"100%",borderRadius:999,backgroundColor:"#8C9670"},note:{fontSize:8,color:"#A99F93"}});