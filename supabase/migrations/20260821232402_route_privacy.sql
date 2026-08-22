alter table public.walks
  add column if not exists route_visibility text not null default 'private';

alter table public.walks
  drop constraint if exists walks_route_visibility_check;

alter table public.walks
  add constraint walks_route_visibility_check
  check (route_visibility in ('private', 'hidden_ends', 'full', 'stats_only'));

update public.walks
set route_visibility = case when share_route then 'full' else 'private' end
where route_visibility = 'private';

create table if not exists public.walk_private_routes (
  walk_id bigint primary key references public.walks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  route_points jsonb not null default '[]'::jsonb,
  constraint walk_private_routes_route_array check (jsonb_typeof(route_points) = 'array')
);

comment on table public.walk_private_routes is 'Owner-only original GPS routes. Community clients must read the privacy-processed route stored on walks.route_points.';

create index if not exists walk_private_routes_user_id_idx
  on public.walk_private_routes (user_id, walk_id);

insert into public.walk_private_routes (walk_id, user_id, route_points)
select id, user_id, route_points
from public.walks
on conflict (walk_id) do nothing;

alter table public.walk_private_routes enable row level security;
revoke all on public.walk_private_routes from public, anon;
grant select, insert on public.walk_private_routes to authenticated;

drop policy if exists "Owners can view original walk routes" on public.walk_private_routes;
create policy "Owners can view original walk routes"
on public.walk_private_routes for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Owners can save original walk routes" on public.walk_private_routes;
create policy "Owners can save original walk routes"
on public.walk_private_routes for insert
to authenticated
with check ((select auth.uid()) = user_id);

create or replace function public.create_walk_with_dog(
  p_dog_id uuid,
  p_title text,
  p_distance_km double precision,
  p_duration_seconds integer,
  p_route_points jsonb,
  p_public_route_points jsonb,
  p_route_visibility text,
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

  safe_public_route := case
    when safe_visibility in ('private', 'stats_only') then '[]'::jsonb
    when safe_visibility = 'full' then coalesce(p_route_points, '[]'::jsonb)
    else coalesce(p_public_route_points, '[]'::jsonb)
  end;

  insert into public.walks (user_id, dog_name, title, distance_km, duration_seconds, route_points, share_route, route_visibility, tags, ended_at)
  values (caller_id, selected_dog_name, left(btrim(coalesce(p_title, '')), 60), p_distance_km, p_duration_seconds, safe_public_route, safe_visibility <> 'private', safe_visibility, coalesce(p_tags, '{}'::text[]), now())
  returning id into new_walk_id;

  insert into public.walk_dogs (walk_id, dog_id) values (new_walk_id, p_dog_id);
  insert into public.walk_private_routes (walk_id, user_id, route_points)
  values (new_walk_id, caller_id, coalesce(p_route_points, '[]'::jsonb));

  return new_walk_id;
end;
$$;

revoke execute on function public.create_walk_with_dog(uuid, text, double precision, integer, jsonb, jsonb, text, boolean, text[]) from public, anon;
grant execute on function public.create_walk_with_dog(uuid, text, double precision, integer, jsonb, jsonb, text, boolean, text[]) to authenticated;
