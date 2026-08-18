import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import * as Location from "expo-location";
import { getDistanceInKm } from "../utils/distance";
import { Point } from "../types/walk";

export function useWalkTracker() {
  const [isWalking, setIsWalking] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [distance, setDistance] = useState(0);
  const [walkFinished, setWalkFinished] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const previousPoint = useRef<Point | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (isWalking) timer = setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => { if (timer) clearInterval(timer); };
  }, [isWalking]);

  useEffect(() => () => locationSubscription.current?.remove(), []);

  async function startWalk() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Location needed", "Waltz needs your location to record walks.");
      return;
    }

    setSeconds(0);
    setDistance(0);
    setPoints([]);
    setWalkFinished(false);
    previousPoint.current = null;
    setIsWalking(true);

    locationSubscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 3 },
      (location) => {
        const currentPoint: Point = { latitude: location.coords.latitude, longitude: location.coords.longitude };
        if (previousPoint.current) {
          setDistance((current) => current + getDistanceInKm(previousPoint.current!, currentPoint));
        }
        previousPoint.current = currentPoint;
        setPoints((current) => [...current, currentPoint]);
      }
    );
  }

  function stopWalk() {
    locationSubscription.current?.remove();
    locationSubscription.current = null;
    previousPoint.current = null;
    setIsWalking(false);
    setWalkFinished(true);
  }

  function resetWalk() {
    locationSubscription.current?.remove();
    locationSubscription.current = null;
    previousPoint.current = null;
    setIsWalking(false);
    setWalkFinished(false);
    setSeconds(0);
    setDistance(0);
    setPoints([]);
  }

  return { isWalking, walkFinished, seconds, distance, points, startWalk, stopWalk, resetWalk };
}
