import { supabase } from "../lib/supabase";
import { FeedBadgeEvent, FeedItem, FeedWalk } from "../types/feed";

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

export const FEED_PAGE_SIZE = 20;

export type FeedPage = {
  items: FeedItem[];
  nextCursor: string | null;
  hasMore: boolean;
};

function itemDate(item: FeedItem) {
  return item.kind === "walk" ? item.ended_at : item.created_at;
}

function itemKey(item: FeedItem) {
  return `${item.kind}-${item.id}`;
}

export async function fetchFeedPage(
  activeDogId: string,
  activeOwnerId: string,
  before?: string,
): Promise<FeedPage> {
  let walksQuery = supabase
    .from("walks")
    .select(
      "id,user_id,dog_name,title,distance_km,duration_seconds,ended_at,route_points,tags,walk_dogs!inner(dog_id,dogs!inner(id,owner_id,name,avatar_url,breed))",
    )
    .eq("share_route", true)
    .eq("hidden_from_profile", false)
    .neq("user_id", activeOwnerId)
    .order("ended_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(FEED_PAGE_SIZE + 1);

  if (before) walksQuery = walksQuery.lt("ended_at", before);

  const { data, error } = await walksQuery;

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

  const feedWalks = walks.flatMap<FeedWalk>((walk) => {
    const link = walk.walk_dogs[0];
    const dogValue = link?.dogs;
    const dog = Array.isArray(dogValue) ? dogValue[0] : dogValue;
    if (!link || !dog) return [];

    const walkBoops = boops.filter((boop) => boop.walk_id === walk.id);
    return [{
      kind: "walk" as const,
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

  let badgesQuery = supabase
    .from("activity_events")
    .select("id,dog_id,badge_id,created_at,dog:dogs!activity_events_dog_id_fkey(name,owner_id)")
    .eq("event_type", "badge_earned")
    .neq("dog.owner_id", activeOwnerId)
    .not("badge_id", "is", null)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(FEED_PAGE_SIZE + 1);

  if (before) badgesQuery = badgesQuery.lt("created_at", before);

  const { data: badgeData, error: badgeError } = await badgesQuery;

  if (badgeError) throw badgeError;
  const badgeEvents = (badgeData ?? []).flatMap<FeedBadgeEvent>((event) => {
    const dogValue = event.dog as { name: string; owner_id: string } | { name: string; owner_id: string }[] | null;
    const dog = Array.isArray(dogValue) ? dogValue[0] : dogValue;
    if (!dog || dog.owner_id === activeOwnerId || !event.badge_id) return [];
    return [{
      kind: "badge" as const,
      id: event.id,
      dog_id: event.dog_id,
      dog_name: dog.name,
      owner_id: dog.owner_id,
      badge_id: event.badge_id,
      created_at: event.created_at,
    }];
  });

  const candidates = [...feedWalks, ...badgeEvents].sort((a, b) => {
    const byDate = new Date(itemDate(b)).getTime() - new Date(itemDate(a)).getTime();
    return byDate || itemKey(b).localeCompare(itemKey(a));
  });
  const items = candidates.slice(0, FEED_PAGE_SIZE);

  return {
    items,
    nextCursor: items.length ? itemDate(items[items.length - 1]) : null,
    hasMore: candidates.length > FEED_PAGE_SIZE,
  };
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
