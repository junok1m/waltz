create table public.walk_places (
  walk_id bigint not null references public.walks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  place_key text not null,
  place_name text not null,
  region text,
  postcode text,
  country_code text,
  latitude double precision,
  longitude double precision,
  distance_meters double precision not null default 0,
  visit_order integer not null default 0,
  primary key (walk_id, place_key),
  constraint walk_places_name_not_blank check (btrim(place_name) <> ''),
  constraint walk_places_latitude_valid check (latitude is null or latitude between -90 and 90),
  constraint walk_places_longitude_valid check (longitude is null or longitude between -180 and 180),
  constraint walk_places_distance_valid check (distance_meters >= 0),
  constraint walk_places_order_valid check (visit_order >= 0)
);

comment on table public.walk_places is 'Owner-only meaningful places crossed by a walk. One row per place per walk.';

create index walk_places_user_id_idx on public.walk_places (user_id, walk_id);
create index walk_places_place_key_idx on public.walk_places (user_id, place_key);

alter table public.walk_places enable row level security;
revoke all on public.walk_places from public, anon;
grant select, insert on public.walk_places to authenticated;

create policy "Owners can view their walk places"
on public.walk_places for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Owners can save their walk places"
on public.walk_places for insert
to authenticated
with check ((select auth.uid()) = user_id);

insert into public.walk_places (
  walk_id, user_id, place_key, place_name, region, postcode, country_code,
  latitude, longitude, distance_meters, visit_order
)
select
  id,
  user_id,
  lower(btrim(suburb_name)) || '|' || lower(coalesce(btrim(location_region), '')) || '|' || lower(coalesce(btrim(location_postcode), '')),
  btrim(suburb_name),
  location_region,
  location_postcode,
  location_country_code,
  location_latitude,
  location_longitude,
  0,
  0
from public.walks
where user_id is not null and nullif(btrim(coalesce(suburb_name, '')), '') is not null
on conflict (walk_id, place_key) do nothing;

drop function if exists public.create_walk_with_dog(
  uuid, text, double precision, integer, jsonb, jsonb, text, boolean, text[],
  double precision, text, integer, text, text, text, text, double precision, double precision
);

create function public.create_walk_with_dog(
  p_dog_id uuid,
  p_title text,
  p_distance_km double precision,
  p_duration_seconds integer,
  p_route_points jsonb,
  p_public_route_points jsonb,
  p_route_visibility text,
  p_share_route boolean,
  p_tags text[],
  p_weather_temperature_c double precision,
  p_weather_condition text,
  p_weather_code integer,
  p_suburb_name text,
  p_location_region text,
  p_location_postcode text,
  p_location_country_code text,
  p_location_latitude double precision,
  p_location_longitude double precision,
  p_walk_places jsonb default '[]'::jsonb
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  selected_dog_name text;
  new_walk_id bigint;
  safe_visibility text := coalesce(p_route_visibility, 'private');
  safe_public_route jsonb;
  safe_walk_places jsonb := coalesce(p_walk_places, '[]'::jsonb);
begin
  if caller_id is null then raise exception 'You must be signed in to save a walk.'; end if;

  select name into selected_dog_name
  from public.dogs
  where id = p_dog_id and owner_id = caller_id;

  if selected_dog_name is null then raise exception 'The selected dog does not belong to this account.'; end if;
  if p_distance_km is null or p_distance_km < 0 then raise exception 'Walk distance must be zero or greater.'; end if;
  if p_duration_seconds is null or p_duration_seconds < 0 then raise exception 'Walk duration must be zero or greater.'; end if;
  if jsonb_typeof(coalesce(p_route_points, '[]'::jsonb)) <> 'array' then raise exception 'Walk route must be a list of points.'; end if;
  if jsonb_typeof(coalesce(p_public_route_points, '[]'::jsonb)) <> 'array' then raise exception 'Public walk route must be a list of points.'; end if;
  if jsonb_typeof(safe_walk_places) <> 'array' then raise exception 'Walk places must be a list.'; end if;
  if safe_visibility not in ('private', 'hidden_ends', 'full', 'stats_only') then raise exception 'Unsupported route privacy option.'; end if;
  if coalesce(p_share_route, false) <> (safe_visibility <> 'private') then raise exception 'Route sharing and privacy options do not match.'; end if;
  if not coalesce(p_tags, '{}'::text[]) <@ array['trail', 'swim', 'coffee']::text[] then raise exception 'Walk contains an unsupported tag.'; end if;
  if p_weather_condition is not null and p_weather_condition not in ('clear','cloudy','fog','drizzle','rain','heavy_rain','snow','storm','unknown') then raise exception 'Unsupported weather condition.'; end if;
  if p_location_latitude is not null and (p_location_latitude < -90 or p_location_latitude > 90) then raise exception 'Invalid location latitude.'; end if;
  if p_location_longitude is not null and (p_location_longitude < -180 or p_location_longitude > 180) then raise exception 'Invalid location longitude.'; end if;
  if exists (
    select 1 from jsonb_array_elements(safe_walk_places) place
    where nullif(btrim(coalesce(place->>'place_name', '')), '') is null
      or coalesce((place->>'distance_meters')::double precision, 0) < 0
      or coalesce((place->>'visit_order')::integer, 0) < 0
      or ((place->>'latitude') is not null and (place->>'latitude')::double precision not between -90 and 90)
      or ((place->>'longitude') is not null and (place->>'longitude')::double precision not between -180 and 180)
  ) then raise exception 'Walk contains an invalid place.'; end if;

  safe_public_route := case
    when safe_visibility in ('private', 'stats_only') then '[]'::jsonb
    when safe_visibility = 'full' then coalesce(p_route_points, '[]'::jsonb)
    else coalesce(p_public_route_points, '[]'::jsonb)
  end;

  insert into public.walks (
    user_id, dog_name, title, distance_km, duration_seconds, route_points, share_route,
    route_visibility, tags, ended_at, weather_temperature_c, weather_condition, weather_code,
    suburb_name, location_region, location_postcode, location_country_code,
    location_latitude, location_longitude
  ) values (
    caller_id, selected_dog_name, left(btrim(coalesce(p_title, '')), 60), p_distance_km,
    p_duration_seconds, safe_public_route, safe_visibility <> 'private', safe_visibility,
    coalesce(p_tags, '{}'::text[]), now(), p_weather_temperature_c, p_weather_condition, p_weather_code,
    nullif(btrim(coalesce(p_suburb_name, '')), ''),
    nullif(btrim(coalesce(p_location_region, '')), ''),
    nullif(btrim(coalesce(p_location_postcode, '')), ''),
    nullif(upper(btrim(coalesce(p_location_country_code, ''))), ''),
    p_location_latitude, p_location_longitude
  )
  returning id into new_walk_id;

  insert into public.walk_dogs (walk_id, dog_id) values (new_walk_id, p_dog_id);
  insert into public.walk_private_routes (walk_id, user_id, route_points)
  values (new_walk_id, caller_id, coalesce(p_route_points, '[]'::jsonb));

  insert into public.walk_places (
    walk_id, user_id, place_key, place_name, region, postcode, country_code,
    latitude, longitude, distance_meters, visit_order
  )
  select
    new_walk_id,
    caller_id,
    coalesce(
      nullif(btrim(place->>'place_key'), ''),
      lower(btrim(place->>'place_name')) || '|' || lower(coalesce(btrim(place->>'region'), '')) || '|' || lower(coalesce(btrim(place->>'postcode'), ''))
    ),
    btrim(place->>'place_name'),
    nullif(btrim(coalesce(place->>'region', '')), ''),
    nullif(btrim(coalesce(place->>'postcode', '')), ''),
    nullif(upper(btrim(coalesce(place->>'country_code', ''))), ''),
    (place->>'latitude')::double precision,
    (place->>'longitude')::double precision,
    coalesce((place->>'distance_meters')::double precision, 0),
    coalesce((place->>'visit_order')::integer, 0)
  from jsonb_array_elements(safe_walk_places) place
  on conflict (walk_id, place_key) do nothing;

  if jsonb_array_length(safe_walk_places) = 0 and nullif(btrim(coalesce(p_suburb_name, '')), '') is not null then
    insert into public.walk_places (
      walk_id, user_id, place_key, place_name, region, postcode, country_code,
      latitude, longitude, distance_meters, visit_order
    ) values (
      new_walk_id,
      caller_id,
      lower(btrim(p_suburb_name)) || '|' || lower(coalesce(btrim(p_location_region), '')) || '|' || lower(coalesce(btrim(p_location_postcode), '')),
      btrim(p_suburb_name),
      nullif(btrim(coalesce(p_location_region, '')), ''),
      nullif(btrim(coalesce(p_location_postcode, '')), ''),
      nullif(upper(btrim(coalesce(p_location_country_code, ''))), ''),
      p_location_latitude,
      p_location_longitude,
      0,
      0
    );
  end if;

  return new_walk_id;
end;
$$;

revoke execute on function public.create_walk_with_dog(
  uuid, text, double precision, integer, jsonb, jsonb, text, boolean, text[],
  double precision, text, integer, text, text, text, text, double precision, double precision, jsonb
) from public, anon;

grant execute on function public.create_walk_with_dog(
  uuid, text, double precision, integer, jsonb, jsonb, text, boolean, text[],
  double precision, text, integer, text, text, text, text, double precision, double precision, jsonb
) to authenticated;
