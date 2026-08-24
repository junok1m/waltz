import { useCallback, useEffect, useState } from "react";
import { fetchDogBadges } from "../services/badges";
import { fetchDogsForUser } from "../services/dogs";
import { fetchWalks } from "../services/walks";
import { DogBadge } from "../types/badge";
import { Dog } from "../types/dog";
import { Walk } from "../types/walk";

export function useWaltzData(userId: string | null) {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [dogsLoading, setDogsLoading] = useState(false);
  const [dogsError, setDogsError] = useState(false);
  const [activeDogId, setActiveDogId] = useState<string | null>(null);
  const [allWalks, setAllWalks] = useState<Walk[]>([]);
  const [badges, setBadges] = useState<DogBadge[]>([]);

  const refreshDogs = useCallback(async () => {
    if (!userId) return;
    setDogsLoading(true);
    setDogsError(false);
    try {
      const next = await fetchDogsForUser(userId);
      setDogs(next);
      setActiveDogId((current) =>
        current && next.some((dog) => dog.id === current)
          ? current
          : next[0]?.id ?? null
      );
    } catch (error) {
      console.error("Load dogs error:", error);
      setDogsError(true);
    } finally {
      setDogsLoading(false);
    }
  }, [userId]);

  const refreshWalks = useCallback(async () => {
    try {
      const next = await fetchWalks();
      setAllWalks(next);
      return next;
    } catch (error) {
      console.error("Load walks error:", error);
      return null;
    }
  }, []);

  const refreshBadges = useCallback(async (dogId: string) => {
    try {
      const next = await fetchDogBadges(dogId);
      setBadges(next);
      return next;
    } catch (error) {
      console.error("Load badges error:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setDogs([]);
      setAllWalks([]);
      setBadges([]);
      setActiveDogId(null);
      setDogsError(false);
      return;
    }
    void refreshDogs();
    void refreshWalks();
  }, [userId, refreshDogs, refreshWalks]);

  const activeDog = dogs.find((dog) => dog.id === activeDogId) || dogs[0];
  const walks = activeDog
    ? allWalks.filter((walk) => walk.dog_id === activeDog.id)
    : [];

  useEffect(() => {
    if (activeDog?.id) void refreshBadges(activeDog.id);
    else setBadges([]);
  }, [activeDog?.id, refreshBadges]);

  return {
    dogs,
    dogsLoading,
    dogsError,
    activeDogId,
    activeDog,
    walks,
    badges,
    setActiveDogId,
    refreshDogs,
    refreshWalks,
    refreshBadges,
  };
}
