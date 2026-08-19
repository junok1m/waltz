import { Pressable, StyleSheet, Text, View } from "react-native";
import { Point } from "../types/walk";
import { formatTime } from "../utils/time";
import { WaltzMap } from "./WaltzMap";

type Props = { seconds: number; distance: number; points: Point[]; dogName: string; onStopWalk: () => void };

export function WalkingScreen({ seconds, distance, points, dogName, onStopWalk }: Props) {
  const latest = points[points.length - 1];
  return <View style={styles.screen}>
    <Text style={styles.walking}>{dogName} is walking...</Text>
    <View style={styles.mapWrap}>
      {latest ? <WaltzMap points={points} dogName={dogName} interactive showLocation /> : <View style={styles.wait}><Text>📍 Finding your location...</Text></View>}
    </View>
    <View style={styles.metrics}><View><Text style={styles.label}>TIME</Text><Text style={styles.timer}>{formatTime(seconds)}</Text></View><View><Text style={styles.label}>DISTANCE</Text><Text style={styles.distance}>{distance.toFixed(2)} km</Text></View></View>
    <Pressable style={styles.button} onPress={onStopWalk}><Text style={styles.buttonText}>STOP WALK</Text></Pressable>
  </View>;
}

const styles = StyleSheet.create({
  screen:{flex:1,gap:16}, walking:{fontFamily:"Schoolbell_400Regular",fontSize:28,color:"#25211D"},
  mapWrap:{flex:1,minHeight:330,borderRadius:26,overflow:"hidden",backgroundColor:"#EFE8DC"}, wait:{flex:1,alignItems:"center",justifyContent:"center"},
  metrics:{flexDirection:"row",justifyContent:"space-around",backgroundColor:"#FFFDF8",padding:16,borderRadius:22}, label:{fontSize:10,color:"#756B60",fontWeight:"700"},
  timer:{fontSize:28,fontWeight:"800"}, distance:{fontSize:28,fontWeight:"800"}, button:{backgroundColor:"#1D1A17",paddingVertical:18,borderRadius:999,alignItems:"center"}, buttonText:{color:"#fff",fontSize:18,fontWeight:"800"}
});
