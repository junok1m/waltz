import { StyleSheet, Text, View } from "react-native";
import { Balloon,Bird,Coffee,Crown,Fish,Flag,Flame,KeyRound,MoonStar,Mountain,Umbrella } from "@sketchyicons/react-native";

type BadgeMeta={title:string;color:string;icon:(size:number)=>React.ReactNode};

export const BADGE_META:Record<string,BadgeMeta>={
  "keep-flame":{title:"Keep the flame",color:"#F7DDD4",icon:size=><Flame size={size} strokeWidth={2} color="#E87859"/>},
  "limited-welcome-to-waltz":{title:"Welcome to Waltz",color:"#E5EBDD",icon:size=><Balloon size={size} strokeWidth={2} color="#6F7D54"/>},
  trail:{title:"Trail",color:"#EEE0C8",icon:size=><Mountain size={size} strokeWidth={2} color="#796B54"/>},
  "gone-fishing":{title:"Gone fishing",color:"#DDEAF0",icon:size=><Fish size={size} strokeWidth={2} color="#557784"/>},
  "coffee-stop":{title:"Coffee stop",color:"#EADDD2",icon:size=><Coffee size={size} strokeWidth={2} color="#806451"/>},
  "early-bird":{title:"Early bird",color:"#F6EBC4",icon:size=><Bird size={size} strokeWidth={2} color="#7A6F51"/>},
  "night-shift":{title:"Night shift",color:"#E3E0F1",icon:size=><MoonStar size={size} strokeWidth={2} color="#666584"/>},
  "rainy-day":{title:"Rainy day",color:"#DDE8EA",icon:size=><Umbrella size={size} strokeWidth={2} color="#5D7680"/>},
  "mileage-1":{title:"1 km Club",color:"#E5EBDD",icon:size=><Flag size={size} strokeWidth={2} color="#687455"/>},
  "mileage-10":{title:"10 km Club",color:"#F6EBC4",icon:size=><Flag size={size} strokeWidth={2} color="#687455"/>},
  "mileage-30":{title:"30 km Club",color:"#F1DCD3",icon:size=><Flag size={size} strokeWidth={2} color="#687455"/>},
  "mileage-50":{title:"50 km Club",color:"#DDE8EA",icon:size=><Flag size={size} strokeWidth={2} color="#687455"/>},
  "urban-explorer":{title:"Urban explorer",color:"#E6E1F2",icon:size=><KeyRound size={size} strokeWidth={2} color="#6C6482"/>},
  "local-royalty":{title:"Local royalty",color:"#F5E7B8",icon:size=><Crown size={size} strokeWidth={2} color="#8A7440"/>},
};

export function BadgeIcon({badgeId,size=56,showLabel=true,labelLines=1,count=1}:{badgeId:string;size?:number;showLabel?:boolean;labelLines?:number;count?:number}){
  const meta=BADGE_META[badgeId];
  if(!meta)return null;
  const iconSize=Math.round(size*.45);
  const compact=size<=32;
  const itemWidth=showLabel?(compact?42:Math.max(size+18,74)):size;
  return <View style={[s.item,compact&&s.compactItem,{width:itemWidth}]}><View style={[s.circle,{width:size,height:size,borderRadius:size/2,backgroundColor:meta.color}]}>{meta.icon(iconSize)}{count>1?<View style={s.count}><Text style={s.countText}>×{count}</Text></View>:null}</View>{showLabel?<Text numberOfLines={labelLines} style={[s.label,compact&&s.compactLabel,labelLines > 1 && (compact?s.compactLabelTwoLines:s.labelTwoLines),{width:itemWidth}]}>{meta.title}</Text>:null}</View>;
}

const s=StyleSheet.create({item:{alignItems:"center",gap:5},compactItem:{gap:3},circle:{alignItems:"center",justifyContent:"center"},count:{position:"absolute",right:-8,top:-6,minWidth:18,height:14,borderRadius:7,paddingHorizontal:3,alignItems:"center",justifyContent:"center",backgroundColor:"#655D54",borderWidth:1,borderColor:"#F8F3E9"},countText:{fontSize:7,fontWeight:"900",color:"#FFFDF8"},label:{fontSize:9,lineHeight:11,fontWeight:"700",color:"#655D54",textAlign:"center"},compactLabel:{fontSize:7,lineHeight:8},labelTwoLines:{minHeight:22},compactLabelTwoLines:{minHeight:16}});
