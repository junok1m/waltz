import { useRef, useState } from "react";
import { Alert } from "react-native";
import { defaultWalkTitle } from "../components/WalkCompleteScreen";
import { syncDogBadges } from "../services/badges";
import { createWalk } from "../services/walks";
import { Dog } from "../types/dog";
import { Point, RoutePrivacy, Walk, WalkTag } from "../types/walk";

type Options = {
  userId: string | null;
  activeDog: Dog | undefined;
  refreshWalks: () => Promise<Walk[] | null>;
  refreshBadges: (dogId: string) => Promise<unknown>;
};

type CompletedWalk = {
  distance: number;
  seconds: number;
  points: Point[];
  resetWalk: () => void | Promise<void>;
};

type RecoveredMetadata = {
  title: string;
  shareRoute: boolean;
  routePrivacy: RoutePrivacy;
  tags: WalkTag[];
};

export function useWalkCompletion({ userId, activeDog, refreshWalks, refreshBadges }: Options) {
  const [routePrivacy, setRoutePrivacy] = useState<RoutePrivacy>("hidden_ends");
  const [walkTags, setWalkTags] = useState<WalkTag[]>([]);
  const [walkTitle, setWalkTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const saveInFlight = useRef(false);

  function recoverMetadata(metadata: RecoveredMetadata) {
    setWalkTitle(metadata.title);
    setRoutePrivacy(metadata.routePrivacy);
    setWalkTags(metadata.tags);
  }

  function prepareWalk(_shouldShare: boolean) {
    setSaveFailed(false);
    setRoutePrivacy("hidden_ends");
    setWalkTags([]);
    setWalkTitle("");
  }

  function clearMetadata() {
    setWalkTags([]);
    setWalkTitle("");
    setRoutePrivacy("hidden_ends");
  }

  async function discardCompletedWalk(resetWalk: CompletedWalk["resetWalk"]) {
    setSaveFailed(false);
    await resetWalk();
    clearMetadata();
  }

  async function saveCompletedWalk({ distance, seconds, points, resetWalk }: CompletedWalk) {
    if (saveInFlight.current) return;
    if (!activeDog) {
      Alert.alert("No dog selected", "Add a walking buddy first.");
      return;
    }
    if (!userId) {
      Alert.alert("Session expired", "Please sign in again before saving this walk.");
      return;
    }

    saveInFlight.current = true;
    setIsSaving(true);
    setSaveFailed(false);
    let saved = false;
    try {
      await createWalk({
        dogId: activeDog.id,
        title: walkTitle.trim() || defaultWalkTitle(new Date()),
        distanceKm: distance,
        durationSeconds: seconds,
        routePoints: points,
        routePrivacy,
        tags: walkTags,
      });
      saved = true;
      await resetWalk();
      clearMetadata();
      Alert.alert("Saved!", `${activeDog.name} walked ${distance.toFixed(2)} km 🐕`);

      const nextWalks = await refreshWalks();
      if (nextWalks) {
        const dogWalks = nextWalks.filter((walk) => walk.dog_id === activeDog.id);
        await syncDogBadges(activeDog.id, dogWalks);
        await refreshBadges(activeDog.id);
      }
    } catch (error) {
      console.error(saved ? "Post-save refresh error:" : "Save walk error:", error);
      if (!saved) {
        setSaveFailed(true);
      }
    } finally {
      saveInFlight.current = false;
      setIsSaving(false);
    }
  }

  return {
    routePrivacy,
    walkTags,
    walkTitle,
    isSaving,
    saveFailed,
    setRoutePrivacy,
    setWalkTags,
    setWalkTitle,
    recoverMetadata,
    prepareWalk,
    discardCompletedWalk,
    saveCompletedWalk,
  };
}
