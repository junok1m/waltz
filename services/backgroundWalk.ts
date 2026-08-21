import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { loadWalkDraft, saveWalkDraft } from "./walkDraft";
import { evaluateLocationSample, LocationSample } from "../utils/locationFilter";

export const WALK_LOCATION_TASK = "waltz-active-walk-location";

type LocationTaskData = { locations: Location.LocationObject[] };

TaskManager.defineTask<LocationTaskData>(WALK_LOCATION_TASK, async ({ data, error }) => {
  if (error || !data?.locations?.length) {
    if (error) console.warn("Background walk tracking error:", error.message);
    return;
  }

  const draft = await loadWalkDraft();
  if (!draft || draft.status !== "walking") return;

  let previous = draft.lastSample;
  let distanceKm = draft.distanceKm;
  const points = [...draft.points];

  for (const location of data.locations) {
    const sample: LocationSample = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      speed: location.coords.speed,
      timestamp: location.timestamp,
    };
    const decision = evaluateLocationSample(previous, sample);
    if (!decision.accepted) continue;
    previous = sample;
    distanceKm += decision.distanceKm;
    points.push({ latitude: sample.latitude, longitude: sample.longitude });
  }

  if (previous !== draft.lastSample) {
    await saveWalkDraft({ ...draft, distanceKm, points, lastSample: previous });
  }
});

export async function startBackgroundWalkUpdates() {
  if (await Location.hasStartedLocationUpdatesAsync(WALK_LOCATION_TASK)) return;
  await Location.startLocationUpdatesAsync(WALK_LOCATION_TASK, {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 1000,
    distanceInterval: 2,
    activityType: Location.ActivityType.Fitness,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    deferredUpdatesDistance: 5,
    deferredUpdatesInterval: 5000,
    foregroundService: {
      notificationTitle: "Waltz is recording a walk",
      notificationBody: "Your route keeps recording while Waltz is in the background.",
      notificationColor: "#879469",
      killServiceOnDestroy: false,
    },
  });
}

export async function stopBackgroundWalkUpdates() {
  if (await Location.hasStartedLocationUpdatesAsync(WALK_LOCATION_TASK)) {
    await Location.stopLocationUpdatesAsync(WALK_LOCATION_TASK);
  }
}
