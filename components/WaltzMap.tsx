import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Mapbox from "@rnmapbox/maps";
import { Point } from "../types/walk";

const MAPBOX_PUBLIC_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
if (MAPBOX_PUBLIC_TOKEN) Mapbox.setAccessToken(MAPBOX_PUBLIC_TOKEN);

type Props = { points: Point[]; dogName?: string; interactive?: boolean; showLocation?: boolean };

function cameraFor(points: Point[]) {
  if (!points.length) return { center: [151.2093, -33.8688] as [number, number], zoom: 10 };
  let minLat=Infinity,maxLat=-Infinity,minLon=Infinity,maxLon=-Infinity;
  for(const p of points){minLat=Math.min(minLat,p.latitude);maxLat=Math.max(maxLat,p.latitude);minLon=Math.min(minLon,p.longitude);maxLon=Math.max(maxLon,p.longitude)}
  const center:[number,number]=[(minLon+maxLon)/2,(minLat+maxLat)/2];
  const spread=Math.max(maxLat-minLat,maxLon-minLon);
  const zoom=spread<.002?16:spread<.006?15:spread<.015?14:spread<.035?13:spread<.08?12:11;
  return {center,zoom};
}

export function WaltzMap({points,dogName="Waltz",interactive=true,showLocation=false}:Props){
  const line=useMemo(()=>({type:"Feature" as const,properties:{},geometry:{type:"LineString" as const,coordinates:points.map(p=>[p.longitude,p.latitude])}}),[points]);
  const {center,zoom}=cameraFor(points),first=points[0],last=points[points.length-1];
  return <View style={styles.wrap}><Mapbox.MapView style={StyleSheet.absoluteFill} styleURL="mapbox://styles/mapbox/light-v11" logoEnabled={false} compassEnabled={interactive} scaleBarEnabled={false} attributionEnabled scrollEnabled={interactive} pitchEnabled={interactive} rotateEnabled={interactive} zoomEnabled={interactive}>
    <Mapbox.Camera centerCoordinate={center} zoomLevel={zoom} animationDuration={0}/>
    {showLocation?<Mapbox.LocationPuck puckBearingEnabled puckBearing="heading"/>:null}
    {points.length>1?<Mapbox.ShapeSource id="waltz-route-source" shape={line}><Mapbox.LineLayer id="waltz-route-line" style={{lineColor:"#78845C",lineWidth:5,lineCap:"round",lineJoin:"round"}}/></Mapbox.ShapeSource>:null}
    {first?<Mapbox.PointAnnotation id="waltz-start" coordinate={[first.longitude,first.latitude]}><View style={styles.startDot}/></Mapbox.PointAnnotation>:null}
    {last?<Mapbox.PointAnnotation id="waltz-finish" coordinate={[last.longitude,last.latitude]}><View style={styles.finishDot} accessibilityLabel={`${dogName} current location`}/></Mapbox.PointAnnotation>:null}
  </Mapbox.MapView></View>;
}

const styles=StyleSheet.create({wrap:{flex:1,backgroundColor:"#EFE8DC"},startDot:{width:12,height:12,borderRadius:6,backgroundColor:"#FFFDF8",borderWidth:3,borderColor:"#78845C"},finishDot:{width:16,height:16,borderRadius:8,backgroundColor:"#78845C",borderWidth:3,borderColor:"#FFFDF8"}});
