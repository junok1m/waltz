alter table public.walks
  add column if not exists suburb_name text,
  add column if not exists location_region text,
  add column if not exists location_postcode text,
  add column if not exists location_country_code text,
  add column if not exists location_latitude double precision,
  add column if not exists location_longitude double precision;

create or replace function public.create_walk_with_dog(
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
  p_location_longitude double precision
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
  if safe_visibility not in ('private', 'hidden_ends', 'full', 'stats_only') then raise exception 'Unsupported route privacy option.'; end if;
  if coalesce(p_share_route, false) <> (safe_visibility <> 'private') then raise exception 'Route sharing and privacy options do not match.'; end if;
  if not coalesce(p_tags, '{}'::text[]) <@ array['trail', 'swim', 'coffee']::text[] then raise exception 'Walk contains an unsupported tag.'; end if;
  if p_weather_condition is not null and p_weather_condition not in ('clear','cloudy','fog','drizzle','rain','heavy_rain','snow','storm','unknown') then raise exception 'Unsupported weather condition.'; end if;
  if p_location_latitude is not null and (p_location_latitude < -90 or p_location_latitude > 90) then raise exception 'Invalid location latitude.'; end if;
  if p_location_longitude is not null and (p_location_longitude < -180 or p_location_longitude > 180) then raise exception 'Invalid location longitude.'; end if;

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

  return new_walk_id;
end;
$$;

revoke execute on function public.create_walk_with_dog(
  uuid, text, double precision, integer, jsonb, jsonb, text, boolean, text[],
  double precision, text, integer, text, text, text, text, double precision, double precision
) from public, anon;

grant execute on function public.create_walk_with_dog(
  uuid, text, double precision, integer, jsonb, jsonb, text, boolean, text[],
  double precision, text, integer, text, text, text, text, double precision, double precision
) to authenticated;
