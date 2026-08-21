create or replace function public.create_walk_with_dog(
  p_dog_id uuid,
  p_title text,
  p_distance_km double precision,
  p_duration_seconds integer,
  p_route_points jsonb,
  p_share_route boolean,
  p_tags text[]
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
begin
  if caller_id is null then
    raise exception 'You must be signed in to save a walk.';
  end if;

  select name
  into selected_dog_name
  from public.dogs
  where id = p_dog_id
    and owner_id = caller_id;

  if selected_dog_name is null then
    raise exception 'The selected dog does not belong to this account.';
  end if;

  if p_distance_km is null or p_distance_km < 0 then
    raise exception 'Walk distance must be zero or greater.';
  end if;

  if p_duration_seconds is null or p_duration_seconds < 0 then
    raise exception 'Walk duration must be zero or greater.';
  end if;

  if jsonb_typeof(coalesce(p_route_points, '[]'::jsonb)) <> 'array' then
    raise exception 'Walk route must be a list of points.';
  end if;

  if not coalesce(p_tags, '{}'::text[]) <@ array['trail', 'swim', 'coffee']::text[] then
    raise exception 'Walk contains an unsupported tag.';
  end if;

  insert into public.walks (
    user_id,
    dog_name,
    title,
    distance_km,
    duration_seconds,
    route_points,
    share_route,
    tags,
    ended_at
  ) values (
    caller_id,
    selected_dog_name,
    left(btrim(coalesce(p_title, '')), 60),
    p_distance_km,
    p_duration_seconds,
    coalesce(p_route_points, '[]'::jsonb),
    coalesce(p_share_route, false),
    coalesce(p_tags, '{}'::text[]),
    now()
  )
  returning id into new_walk_id;

  insert into public.walk_dogs (walk_id, dog_id)
  values (new_walk_id, p_dog_id);

  return new_walk_id;
end;
$$;

revoke execute on function public.create_walk_with_dog(uuid, text, double precision, integer, jsonb, boolean, text[]) from public;
revoke execute on function public.create_walk_with_dog(uuid, text, double precision, integer, jsonb, boolean, text[]) from anon;
grant execute on function public.create_walk_with_dog(uuid, text, double precision, integer, jsonb, boolean, text[]) to authenticated;
