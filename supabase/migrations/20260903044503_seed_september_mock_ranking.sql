-- Current-month activity for the nine stable community dogs.
-- Fixed September 2026 dates keep this seed deterministic and idempotent.

do $$
declare
  seed record;
  walk_number integer;
  new_walk_id bigint;
  walk_title text;
  walk_distance double precision;
begin
  for seed in
    select * from (values
      ('10000000-0000-4000-8000-000000000001'::uuid, 'b97b0e25-1a05-4554-949b-53268917d032'::uuid, 'Milo',    'September sniffari', array[1.8,2.1,1.9]::double precision[]),
      ('10000000-0000-4000-8000-000000000002'::uuid, 'b97b0e25-1a05-4554-949b-53268917d032'::uuid, 'Luna',    'September sprint',   array[3.6,4.1,3.7]::double precision[]),
      ('10000000-0000-4000-8000-000000000003'::uuid, 'b97b0e25-1a05-4554-949b-53268917d032'::uuid, 'Mochi',   'Selective stroll',   array[1.4,1.7,1.8]::double precision[]),
      ('10000000-0000-4000-8000-000000000004'::uuid, 'd7a1e041-cc5e-4391-9e0e-bdd84a4f1431'::uuid, 'Archie',  'Excellent stick',    array[5.0,4.8,5.4]::double precision[]),
      ('10000000-0000-4000-8000-000000000005'::uuid, 'd7a1e041-cc5e-4391-9e0e-bdd84a4f1431'::uuid, 'Nala',    'Big opinions',       array[1.1,1.4,1.3]::double precision[]),
      ('10000000-0000-4000-8000-000000000006'::uuid, 'd7a1e041-cc5e-4391-9e0e-bdd84a4f1431'::uuid, 'Pepper',  'Mayor patrol',       array[2.8,3.1,2.8]::double precision[]),
      ('10000000-0000-4000-8000-000000000007'::uuid, '01f401ef-8d1a-4900-8a17-af97ccfb50c3'::uuid, 'Teddy',   'Long way home',      array[5.9,6.4,5.8]::double precision[]),
      ('10000000-0000-4000-8000-000000000008'::uuid, '01f401ef-8d1a-4900-8a17-af97ccfb50c3'::uuid, 'Coco',    'Tiny legs tour',     array[2.0,2.3,2.3]::double precision[]),
      ('10000000-0000-4000-8000-000000000009'::uuid, '01f401ef-8d1a-4900-8a17-af97ccfb50c3'::uuid, 'Biscuit', 'Interesting smell', array[3.2,3.5,3.5]::double precision[])
    ) as v(dog_id, owner_id, dog_name, title_prefix, distances)
  loop
    for walk_number in 1..3 loop
      walk_title := seed.title_prefix || ' #' || walk_number;
      walk_distance := seed.distances[walk_number];

      if not exists (
        select 1 from public.walks w
        join public.walk_dogs wd on wd.walk_id = w.id
        where wd.dog_id = seed.dog_id
          and w.title = walk_title
          and w.is_mock = true
      ) then
        insert into public.walks (
          user_id, dog_name, title, distance_km, duration_seconds, ended_at,
          route_points, share_route, route_visibility, tags, is_mock, hidden_from_profile
        ) values (
          seed.owner_id, seed.dog_name, walk_title, walk_distance,
          round(walk_distance * 780)::integer,
          make_timestamptz(2026, 9, walk_number, 7 + walk_number, 15, 0, 'Australia/Sydney'),
          '[]'::jsonb, true, 'hidden_ends', array[]::text[], true, false
        ) returning id into new_walk_id;

        insert into public.walk_dogs (walk_id, dog_id)
        values (new_walk_id, seed.dog_id);
      end if;
    end loop;
  end loop;
end
$$;

-- The client receives monthly aggregates only; exact private walks and routes
-- remain behind their existing RLS policies.
create or replace function public.get_monthly_dog_ranking()
returns table (
  rank bigint,
  dog_id uuid,
  dog_name text,
  avatar_url text,
  distance_km numeric,
  walk_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with bounds as (
    select
      date_trunc('month', now() at time zone 'Australia/Sydney') at time zone 'Australia/Sydney' as starts_at,
      (date_trunc('month', now() at time zone 'Australia/Sydney') + interval '1 month') at time zone 'Australia/Sydney' as ends_at
  ),
  totals as (
    select
      d.id as dog_id,
      d.name as dog_name,
      d.avatar_url,
      round(sum(w.distance_km)::numeric, 2) as distance_km,
      count(w.id)::bigint as walk_count
    from public.dogs d
    join public.walk_dogs wd on wd.dog_id = d.id
    join public.walks w on w.id = wd.walk_id
    cross join bounds b
    where (select auth.uid()) is not null
      and w.ended_at >= b.starts_at
      and w.ended_at < b.ends_at
    group by d.id, d.name, d.avatar_url
  )
  select
    row_number() over (order by totals.distance_km desc, totals.walk_count desc, totals.dog_name asc),
    totals.dog_id,
    totals.dog_name,
    totals.avatar_url,
    totals.distance_km,
    totals.walk_count
  from totals
  order by totals.distance_km desc, totals.walk_count desc, totals.dog_name asc;
$$;

revoke all on function public.get_monthly_dog_ranking() from public, anon;
grant execute on function public.get_monthly_dog_ranking() to authenticated;
