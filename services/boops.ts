import { supabase } from "../lib/supabase";
import { FeedWalk } from "../types/feed";

type RawFeedDog = {
  id: string;
  owner_id: string;
  name: string;
  avatar_url: string | null;
  breed: string | null;
};

type RawFeedWalk = {
  id: number;
  user_id: string;
  dog_name: string;
  title: string | null;
  distance_km: number;
  duration_seconds: number;
  ended_at: string;
  route_points: FeedWalk["route_points"] | null;
  tags: FeedWalk["tags"] | null;
  walk_dogs: Array<{
    dog_id: string;
    dogs: RawFeedDog | RawFeedDog[] | null;
  }>;
};

type RawBoop = {
  id: number;
  walk_id: number;
  from_dog_id: string;
};

export async function fetchFeedWalks(activeDogId: string, activeOwnerId: string): Promise<FeedWalk[]> {
  const { data, error } = await supabase
    .from("walks")
    .select(
      "id,user_id,dog_name,title,distance_km,duration_seconds,ended_at,route_points,tags,walk_dogs!inner(dog_id,dogs!inner(id,owner_id,name,avatar_url,breed))",
    )
    .eq("share_route", true)
    .eq("hidden_from_profile", false)
    .neq("user_id", activeOwnerId)
    .order("ended_at", { ascending: false })
    .limit(30);

  if (error) throw error;

  const walks = (data ?? []) as unknown as RawFeedWalk[];
  const walkIds = walks.map((walk) => walk.id);
  let boops: RawBoop[] = [];

  if (walkIds.length) {
    const { data: boopData, error: boopError } = await supabase
      .from("boops")
      .select("id,walk_id,from_dog_id")
      .in("walk_id", walkIds);

    if (boopError) throw boopError;
    boops = (boopData ?? []) as RawBoop[];
  }

  return walks.flatMap((walk) => {
    const link = walk.walk_dogs[0];
    const dogValue = link?.dogs;
    const dog = Array.isArray(dogValue) ? dogValue[0] : dogValue;
    if (!link || !dog) return [];

    const walkBoops = boops.filter((boop) => boop.walk_id === walk.id);
    return [{
      id: walk.id,
      user_id: walk.user_id,
      dog_id: dog.id,
      dog_name: dog.name || walk.dog_name,
      dog_avatar_url: dog.avatar_url,
      dog_breed: dog.breed,
      owner_id: dog.owner_id,
      title: walk.title,
      distance_km: walk.distance_km,
      duration_seconds: walk.duration_seconds,
      ended_at: walk.ended_at,
      route_points: walk.route_points ?? [],
      tags: walk.tags ?? [],
      boop_count: walkBoops.length,
      booped_by_me: walkBoops.some((boop) => boop.from_dog_id === activeDogId),
    }];
  });
}

export async function setWalkBoop(input: {
  fromDogId: string;
  toDogId: string;
  walkId: number;
  booped: boolean;
}) {
  if (input.booped) {
    const { error } = await supabase
      .from("boops")
      .delete()
      .eq("from_dog_id", input.fromDogId)
      .eq("walk_id", input.walkId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("boops").insert({
    from_dog_id: input.fromDogId,
    to_dog_id: input.toDogId,
    walk_id: input.walkId,
  });
  if (error) throw error;
}

export async function fetchBoopCountsByWalkIds(walkIds: number[]): Promise<Record<number, number>> {
  if (!walkIds.length) return {};
  const { data, error } = await supabase.from("boops").select("walk_id").in("walk_id", walkIds);
  if (error) throw error;
  return (data ?? []).reduce<Record<number, number>>((counts, boop) => {
    counts[boop.walk_id] = (counts[boop.walk_id] ?? 0) + 1;
    return counts;
  }, {});
}
