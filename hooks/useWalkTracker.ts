import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import * as Location from "expo-location";
import { Point } from "../types/walk";
import { evaluateLocationSample, LocationSample } from "../utils/locationFilter";

export function useWalkTracker() {
  const [isWalking, setIsWalking] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [distance, setDistance] = useState(0);
  const [walkFinished, setWalkFinished] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const previousPoint = useRef<LocationSample | null>(null);
  const startingWalk = useRef(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (isWalking) timer = setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => { if (timer) clearInterval(timer); };
  }, [isWalking]);

  useEffect(() => () => locationSubscription.current?.remove(), []);

  async function startWalk() {
    if (startingWalk.current || isWalking) return;
    startingWalk.current = true;

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Location needed", "Waltz needs your location to record walks.");
        return;
      }

      if (permission.ios?.accuracy === "reduced" || permission.android?.accuracy === "coarse") {
        Alert.alert("Precise location needed", "Turn on Precise Location for Waltz in your phone settings so short walks can be measured accurately.");
        return;
      }

      setSeconds(0);
      setDistance(0);
      setPoints([]);
      setWalkFinished(false);
      previousPoint.current = null;
      locationSubscription.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 2 },
        (location) => {
          const currentPoint: LocationSample = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            speed: location.coords.speed,
            timestamp: location.timestamp,
          };
          const decision = evaluateLocationSample(previousPoint.current, currentPoint);
          if (!decision.accepted) return;

          previousPoint.current = currentPoint;
          if (decision.distanceKm > 0) setDistance((current) => current + decision.distanceKm);
          setPoints((current) => [...current, currentPoint]);
        },
        (reason) => console.warn("Location tracking error:", reason),
      );
      setIsWalking(true);
    } catch (error) {
      locationSubscription.current?.remove();
      locationSubscription.current = null;
      Alert.alert("Couldn't start tracking", error instanceof Error ? error.message : "Please check your location settings and try again.");
    } finally {
      startingWalk.current = false;
    }
  }

  function stopWalk() {
    locationSubscription.current?.remove();
    locationSubscription.current = null;
    previousPoint.current = null;
    startingWalk.current = false;
    setIsWalking(false);
    setWalkFinished(true);
  }

  function resetWalk() {
    locationSubscription.current?.remove();
    locationSubscription.current = null;
    previousPoint.current = null;
    startingWalk.current = false;
    setIsWalking(false);
    setWalkFinished(false);
    setSeconds(0);
    setDistance(0);
    setPoints([]);
  }

  return { isWalking, walkFinished, seconds, distance, points, startWalk, stopWalk, resetWalk };
}
