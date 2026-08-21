import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import * as Location from "expo-location";
import { clearWalkDraft, loadWalkDraft, saveWalkDraft, WalkDraft } from "../services/walkDraft";
import { Point, WalkTag } from "../types/walk";
import { evaluateLocationSample, LocationSample } from "../utils/locationFilter";

type DraftMetadata = { title: string; shareRoute: boolean; tags: WalkTag[] };
type Options = {
  userId: string | null;
  onRecoverDogId: (dogId: string) => void;
  onRecoverMetadata: (metadata: DraftMetadata) => void;
};

export function useWalkTracker({ userId, onRecoverDogId, onRecoverMetadata }: Options) {
  const [isWalking, setIsWalking] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [distance, setDistance] = useState(0);
  const [walkFinished, setWalkFinished] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [trackerReady, setTrackerReady] = useState(false);

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const previousPoint = useRef<LocationSample | null>(null);
  const startingWalk = useRef(false);
  const startedAt = useRef<number | null>(null);
  const endedAt = useRef<number | null>(null);
  const distanceRef = useRef(0);
  const pointsRef = useRef<Point[]>([]);
  const draftOwner = useRef<{ userId: string; dogId: string } | null>(null);
  const draftStatus = useRef<WalkDraft["status"] | null>(null);
  const metadataRef = useRef<DraftMetadata>({ title: "", shareRoute: false, tags: [] });
  const draftWriteQueue = useRef<Promise<void>>(Promise.resolve());
  const recoveryUser = useRef<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (isWalking && startedAt.current !== null) {
      const update = () => setSeconds(Math.max(0, Math.floor((Date.now() - Number(startedAt.current)) / 1000)));
      update();
      timer = setInterval(update, 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [isWalking]);

  useEffect(() => () => locationSubscription.current?.remove(), []);

  useEffect(() => {
    if (!userId) {
      recoveryUser.current = null;
      setTrackerReady(true);
      return;
    }
    if (recoveryUser.current === userId) return;
    recoveryUser.current = userId;
    setTrackerReady(false);
    let cancelled = false;

    loadWalkDraft()
      .then((draft) => {
        if (cancelled || !draft || draft.userId !== userId) return;
        onRecoverDogId(draft.dogId);
        onRecoverMetadata({ title: draft.title, shareRoute: draft.shareRoute, tags: draft.tags });
        if (draft.status === "finished") {
          hydrateDraft(draft, true);
          return;
        }
        Alert.alert(
          "Walk in progress",
          "Waltz found a walk that wasn't finished. Would you like to keep going?",
          [
            { text: "Discard", style: "destructive", onPress: resetWalk },
            { text: "Resume", onPress: () => resumeDraft(draft) },
          ],
        );
      })
      .catch((error) => console.warn("Couldn't restore walk:", error))
      .finally(() => { if (!cancelled) setTrackerReady(true); });

    return () => { cancelled = true; };
  }, [userId]);

  async function startWalk(input: { dogId: string; shareRoute: boolean }) {
    if (!userId || startingWalk.current || isWalking) return;
    startingWalk.current = true;

    try {
      if (!await ensurePreciseLocation()) return;
      resetTrackerState();
      startedAt.current = Date.now();
      draftOwner.current = { userId, dogId: input.dogId };
      draftStatus.current = "walking";
      metadataRef.current = { title: "", shareRoute: input.shareRoute, tags: [] };
      await queueDraftSave(buildDraft("walking"));
      await subscribeToLocations();
      setIsWalking(true);
    } catch (error) {
      locationSubscription.current?.remove();
      locationSubscription.current = null;
      resetTrackerState();
      queueClearDraft();
      Alert.alert("Couldn't start tracking", error instanceof Error ? error.message : "Please check your location settings and try again.");
    } finally {
      startingWalk.current = false;
    }
  }

  async function resumeDraft(draft: WalkDraft) {
    if (startingWalk.current) return;
    startingWalk.current = true;
    hydrateDraft(draft, false);
    // Do not count the straight-line gap while the app was not recording.
    previousPoint.current = null;
    try {
      if (!await ensurePreciseLocation()) throw new Error("Precise location is required to resume this walk.");
      await subscribeToLocations();
      setIsWalking(true);
    } catch (error) {
      const now = Date.now();
      endedAt.current = now;
      draftStatus.current = "finished";
      setSeconds(elapsedSeconds(now));
      setWalkFinished(true);
      queueDraftSave(buildDraft("finished"));
      Alert.alert("Walk recovered", "Tracking couldn't resume, but your recorded walk is safe and ready to save.");
      console.warn("Couldn't resume walk:", error);
    } finally {
      startingWalk.current = false;
    }
  }

  async function subscribeToLocations() {
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
        distanceRef.current += decision.distanceKm;
        pointsRef.current = [...pointsRef.current, {
          latitude: currentPoint.latitude,
          longitude: currentPoint.longitude,
        }];
        setDistance(distanceRef.current);
        setPoints(pointsRef.current);
        if (draftStatus.current === "walking") queueDraftSave(buildDraft("walking"));
      },
      (reason) => console.warn("Location tracking error:", reason),
    );
  }

  async function ensurePreciseLocation() {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Location needed", "Waltz needs your location to record walks.");
      return false;
    }
    if (permission.ios?.accuracy === "reduced" || permission.android?.accuracy === "coarse") {
      Alert.alert("Precise location needed", "Turn on Precise Location for Waltz in your phone settings so short walks can be measured accurately.");
      return false;
    }
    return true;
  }

  function stopWalk() {
    locationSubscription.current?.remove();
    locationSubscription.current = null;
    const now = Date.now();
    endedAt.current = now;
    draftStatus.current = "finished";
    setSeconds(elapsedSeconds(now));
    setIsWalking(false);
    setWalkFinished(true);
    queueDraftSave(buildDraft("finished"));
  }

  async function resetWalk() {
    locationSubscription.current?.remove();
    locationSubscription.current = null;
    startingWalk.current = false;
    resetTrackerState();
    await queueClearDraft();
  }

  function updateWalkDraftMetadata(update: Partial<DraftMetadata>) {
    metadataRef.current = { ...metadataRef.current, ...update };
    if (draftStatus.current) queueDraftSave(buildDraft(draftStatus.current));
  }

  function hydrateDraft(draft: WalkDraft, finished: boolean) {
    startedAt.current = draft.startedAt;
    endedAt.current = draft.endedAt;
    distanceRef.current = draft.distanceKm;
    pointsRef.current = draft.points;
    previousPoint.current = draft.lastSample;
    draftOwner.current = { userId: draft.userId, dogId: draft.dogId };
    draftStatus.current = finished ? "finished" : "walking";
    metadataRef.current = { title: draft.title, shareRoute: draft.shareRoute, tags: draft.tags };
    setDistance(draft.distanceKm);
    setPoints(draft.points);
    setSeconds(elapsedSeconds(finished ? draft.endedAt ?? Date.now() : Date.now()));
    setIsWalking(false);
    setWalkFinished(finished);
  }

  function buildDraft(status: WalkDraft["status"]): WalkDraft {
    if (!draftOwner.current || startedAt.current === null) throw new Error("Walk draft is missing its owner or start time.");
    return {
      version: 1,
      userId: draftOwner.current.userId,
      dogId: draftOwner.current.dogId,
      status,
      startedAt: startedAt.current,
      endedAt: status === "finished" ? endedAt.current ?? Date.now() : null,
      distanceKm: distanceRef.current,
      points: pointsRef.current,
      lastSample: previousPoint.current,
      ...metadataRef.current,
    };
  }

  function elapsedSeconds(end: number) {
    return startedAt.current === null ? 0 : Math.max(0, Math.floor((end - startedAt.current) / 1000));
  }

  function queueDraftSave(draft: WalkDraft) {
    draftWriteQueue.current = draftWriteQueue.current
      .catch(() => undefined)
      .then(() => saveWalkDraft(draft))
      .catch((error) => console.warn("Couldn't preserve walk:", error));
    return draftWriteQueue.current;
  }

  function queueClearDraft() {
    draftWriteQueue.current = draftWriteQueue.current
      .catch(() => undefined)
      .then(clearWalkDraft)
      .catch((error) => console.warn("Couldn't clear walk draft:", error));
    return draftWriteQueue.current;
  }

  function resetTrackerState() {
    previousPoint.current = null;
    startedAt.current = null;
    endedAt.current = null;
    distanceRef.current = 0;
    pointsRef.current = [];
    draftOwner.current = null;
    draftStatus.current = null;
    metadataRef.current = { title: "", shareRoute: false, tags: [] };
    setIsWalking(false);
    setWalkFinished(false);
    setSeconds(0);
    setDistance(0);
    setPoints([]);
  }

  const readyForUser = !userId || (trackerReady && recoveryUser.current === userId);
  return { isWalking, walkFinished, seconds, distance, points, trackerReady: readyForUser, startWalk, stopWalk, resetWalk, updateWalkDraftMetadata };
}
