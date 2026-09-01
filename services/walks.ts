import { supabase } from "../lib/supabase";
import { Point, RoutePrivacy, Walk, WalkLocation, WalkTag, WalkWeather } from "../types/walk";
import { publicRouteForPrivacy } from "../utils/routePrivacy";

type RawWalk = Omit<Walk, "dog_id"> & {
  walk_dogs: Array<{ dog_id: string }>;
};

export async function fetchWalks(): Promise<Walk[]> {
  const pageSize = 1000;
  const all: Walk[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("walks")
      .select("*,walk_dogs!inner(dog_id)")
      .order("ended_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    const page = (data ?? []) as unknown as RawWalk[];
    const walks = page.map(({ walk_dogs, ...walk }) => ({
      ...walk,
      dog_id: walk_dogs[0].dog_id,
    }));
    const walkIds = walks.map((walk) => walk.id);
    const privateRoutes = new Map<number, Point[]>();
    for (let index = 0; index < walkIds.length; index += 200) {
      const { data: routes, error: routeError } = await supabase
        .from("walk_private_routes")
        .select("walk_id,route_points")
        .in("walk_id", walkIds.slice(index, index + 200));
      if (routeError) throw routeError;
      for (const route of routes ?? []) privateRoutes.set(route.walk_id, route.route_points as Point[]);
    }
    all.push(...walks.map((walk) => ({ ...walk, route_points: privateRoutes.get(walk.id) ?? walk.route_points })));
    if (page.length < pageSize) break;
  }

  return all;
}

export async function createWalk(input: {
  dogId: string;
  title: string;
  distanceKm: number;
  durationSeconds: number;
  routePoints: Point[];
  routePrivacy: RoutePrivacy;
  tags: WalkTag[];
  weather: WalkWeather | null;
  location: WalkLocation | null;
}) {
  const publicRoute = publicRouteForPrivacy(input.routePoints, input.routePrivacy);
  const privateRoute = input.routePrivacy === "stats_only" ? [] : input.routePoints;
  const { data: walkId, error } = await supabase.rpc("create_walk_with_dog", {
    p_dog_id: input.dogId,
    p_title: input.title.trim(),
    p_distance_km: input.distanceKm,
    p_duration_seconds: input.durationSeconds,
    p_route_points: privateRoute,
    p_public_route_points: publicRoute,
    p_route_visibility: input.routePrivacy,
    p_share_route: input.routePrivacy !== "private",
    p_tags: input.tags,
    p_weather_temperature_c: input.weather?.temperatureC ?? null,
    p_weather_condition: input.weather?.condition ?? null,
    p_weather_code: input.weather?.code ?? null,
    p_suburb_name: input.location?.suburbName ?? null,
    p_location_region: input.location?.region ?? null,
    p_location_postcode: input.location?.postcode ?? null,
    p_location_country_code: input.location?.countryCode ?? null,
    p_location_latitude: input.location?.latitude ?? null,
    p_location_longitude: input.location?.longitude ?? null,
  });

  if (error) throw error;
  return { id: Number(walkId) };
}

export async function setWalkHiddenFromProfile(walkId:number, hidden:boolean){
  const { error } = await supabase.from("walks").update({ hidden_from_profile:hidden }).eq("id",walkId);
  if(error) throw error;
}

export async function deleteWalk(walkId:number){
  const { error } = await supabase.from("walks").delete().eq("id",walkId);
  if(error) throw error;
}
