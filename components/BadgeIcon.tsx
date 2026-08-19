import { StyleSheet, Text, View } from "react-native";
import { Balloon,Bird,Coffee,Crown,Fish,Flag,Flame,KeyRound,MoonStar,Mountain,Umbrella } from "@sketchyicons/react-native";

type BadgeMeta={title:string;color:string;icon:(size:number)=>React.ReactNode};

export const BADGE_META:Record<string,BadgeMeta>={
  "keep-flame":{title:"Keep the flame",color:"#F7DDD4",icon:size=><Flame size={size} strokeWidth={2} color="#E87859"/>},
  "tiny-adventures":{title:"Tiny adventures",color:"#E5EBDD",icon:size=><Balloon size={size} strokeWidth={2} color="#6F7D54"/>},
  trail:{title:"Trail",color:"#EEE0C8",icon:size=><Mountain size={size} strokeWidth={2} color="#796B54"/>},
  "gone-fishing":{title:"Gone fishing",color:"#DDEAF0",icon:size=><Fish size={size} strokeWidth={2} color="#557784"/>},
  "coffee-stop":{title:"Coffee stop",color:"#EADDD2",icon:size=><Coffee size={size} strokeWidth={2} color="#806451"/>},
  "early-bird":{title:"Early bird",color:"#F6EBC4",icon:size=><Bird size={size} strokeWidth={2} color="#7A6F51"/>},
  "night-shift":{title:"Night shift",color:"#E3E0F1",icon:size=><MoonStar size={size} strokeWidth={2} color="#666584"/>},
  "rainy-day":{title:"Rainy day",color:"#DDE8EA",icon:size=><Umbrella size={size} strokeWidth={2} color="#5D7680"/>},
  "mileage-10":{title:"First 10 km",color:"#E5EBDD",icon:size=><Flag size={size} strokeWidth={2} color="#687455"/>},
  "mileage-100":{title:"First 100 km",color:"#F6EBC4",icon:size=><Flag size={size} strokeWidth={2} color="#687455"/>},
  "mileage-500":{title:"First 500 km",color:"#F1DCD3",icon:size=><Flag size={size} strokeWidth={2} color="#687455"/>},
  "mileage-1000":{title:"First 1,000 km",color:"#DDE8EA",icon:size=><Flag size={size} strokeWidth={2} color="#687455"/>},
  "urban-explorer":{title:"Urban explorer",color:"#E6E1F2",icon:size=><KeyRound size={size} strokeWidth={2} color="#6C6482"/>},
  "local-royalty":{title:"Local royalty",color:"#F5E7B8",icon:size=><Crown size={size} strokeWidth={2} color="#8A7440"/>},
};

export function BadgeIcon({badgeId,size=56,showLabel=true}:{badgeId:string;size?:number;showLabel?:boolean}){
  const meta=BADGE_META[badgeId];
  if(!meta)return null;
  const iconSize=Math.round(size*.45);
  return <View style={[s.item,{width:showLabel?Math.max(size+18,74):size}]}><View style={[s.circle,{width:size,height:size,borderRadius:size/2,backgroundColor:meta.color}]}>{meta.icon(iconSize)}</View>{showLabel?<Text numberOfLines={1} style={[s.label,{width:Math.max(size+18,74)}]}>{meta.title}</Text>:null}</View>;
}

const s=StyleSheet.create({item:{alignItems:"center",gap:5},circle:{alignItems:"center",justifyContent:"center"},label:{fontSize:9,fontWeight:"700",color:"#655D54",textAlign:"center"}});
