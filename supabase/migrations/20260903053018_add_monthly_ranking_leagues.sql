drop trigger if exists monthly_ranking_change_trigger on public.walk_dogs;

alter table private.monthly_ranking_snapshots
  add column category text not null default 'distance',
  add column places_count integer not null default 0 check (places_count >= 0);

alter table private.monthly_ranking_snapshots
  drop constraint monthly_ranking_snapshots_pkey,
  add constraint monthly_ranking_snapshots_category_check
    check (category in ('distance', 'waltzes', 'places')),
  add primary key (period_key, category, dog_id);

create index monthly_ranking_snapshots_dog_id_idx
on private.monthly_ranking_snapshots (dog_id);

-- One internal aggregate powers the public league and the private activity
-- snapshots so the three leaderboards always use exactly the same rules.
create function private.monthly_dog_rankings(p_at timestamptz)
returns table (
  dog_id uuid,
  dog_name text,
  avatar_url text,
  distance_km numeric,
  walk_count bigint,
  places_count bigint,
  distance_rank bigint,
  waltzes_rank bigint,
  places_rank bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with bounds as (
    select
      date_trunc('month', p_at at time zone 'Australia/Sydney') at time zone 'Australia/Sydney' as starts_at,
      (date_trunc('month', p_at at time zone 'Australia/Sydney') + interval '1 month') at time zone 'Australia/Sydney' as ends_at
  ),
  monthly_totals as (
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
    where w.ended_at >= b.starts_at and w.ended_at < b.ends_at
    group by d.id, d.name, d.avatar_url
  ),
  first_places as (
    select wd.dog_id, wp.place_key, min(w.ended_at) as first_seen_at
    from public.walk_places wp
    join public.walks w on w.id = wp.walk_id
    join public.walk_dogs wd on wd.walk_id = w.id
    group by wd.dog_id, wp.place_key
  ),
  place_totals as (
    select fp.dog_id, count(*)::bigint as places_count
    from first_places fp
    cross join bounds b
    where fp.first_seen_at >= b.starts_at and fp.first_seen_at < b.ends_at
    group by fp.dog_id
  ),
  totals as (
    select mt.*, coalesce(pt.places_count, 0)::bigint as places_count
    from monthly_totals mt
    left join place_totals pt on pt.dog_id = mt.dog_id
  )
  select
    totals.dog_id,
    totals.dog_name,
    totals.avatar_url,
    totals.distance_km,
    totals.walk_count,
    totals.places_count,
    row_number() over (
      order by totals.distance_km desc, totals.walk_count desc, totals.dog_name asc, totals.dog_id
    ) as distance_rank,
    row_number() over (
      order by totals.walk_count desc, totals.distance_km desc, totals.dog_name asc, totals.dog_id
    ) as waltzes_rank,
    row_number() over (
      order by totals.places_count desc, totals.distance_km desc, totals.dog_name asc, totals.dog_id
    ) as places_rank
  from totals;
$$;

revoke all on function private.monthly_dog_rankings(timestamptz) from public, anon, authenticated;

drop function public.get_monthly_dog_ranking();

create function public.get_monthly_dog_ranking()
returns table (
  dog_id uuid,
  dog_name text,
  avatar_url text,
  distance_km numeric,
  walk_count bigint,
  places_count bigint,
  distance_rank bigint,
  waltzes_rank bigint,
  places_rank bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select rankings.*
  from private.monthly_dog_rankings(now()) rankings
  where (select auth.uid()) is not null;
$$;

revoke all on function public.get_monthly_dog_ranking() from public, anon;
grant execute on function public.get_monthly_dog_ranking() to authenticated;

create function private.refresh_monthly_ranking_category(
  p_walk_id bigint,
  p_dog_id uuid,
  p_category text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  walk_ended_at timestamptz;
  award_period text;
  previous_rank integer;
  current_rank integer;
  current_distance numeric;
  current_walk_count integer;
  current_places_count integer;
begin
  if p_category not in ('distance', 'waltzes', 'places') then
    raise exception 'Unsupported ranking category.';
  end if;

  select w.ended_at into strict walk_ended_at
  from public.walks w
  where w.id = p_walk_id;

  award_period := to_char(walk_ended_at at time zone 'Australia/Sydney', 'YYYY-MM');

  select s.rank into previous_rank
  from private.monthly_ranking_snapshots s
  where s.period_key = award_period
    and s.category = p_category
    and s.dog_id = p_dog_id;

  select
    case p_category
      when 'distance' then r.distance_rank
      when 'waltzes' then r.waltzes_rank
      else r.places_rank
    end,
    r.distance_km,
    r.walk_count,
    r.places_count
  into current_rank, current_distance, current_walk_count, current_places_count
  from private.monthly_dog_rankings(walk_ended_at) r
  where r.dog_id = p_dog_id;

  if previous_rank is not null and current_rank < previous_rank then
    insert into public.activity_events (dog_id, event_type, walk_id, metadata, created_at)
    values (
      p_dog_id,
      'ranking_climbed',
      p_walk_id,
      jsonb_build_object(
        'period_key', award_period,
        'category', p_category,
        'old_rank', previous_rank,
        'new_rank', current_rank,
        'distance_km', current_distance,
        'walk_count', current_walk_count,
        'places_count', current_places_count,
        'feed_visible', current_rank = 1 or (current_rank <= 3 and previous_rank > 3)
      ),
      walk_ended_at
    );
  end if;

  insert into private.monthly_ranking_snapshots (
    period_key, category, dog_id, rank, distance_km, walk_count, places_count, updated_at
  )
  select
    award_period,
    p_category,
    r.dog_id,
    case p_category
      when 'distance' then r.distance_rank
      when 'waltzes' then r.waltzes_rank
      else r.places_rank
    end,
    r.distance_km,
    r.walk_count,
    r.places_count,
    now()
  from private.monthly_dog_rankings(walk_ended_at) r
  on conflict (period_key, category, dog_id) do update set
    rank = excluded.rank,
    distance_km = excluded.distance_km,
    walk_count = excluded.walk_count,
    places_count = excluded.places_count,
    updated_at = excluded.updated_at;
end;
$$;

revoke all on function private.refresh_monthly_ranking_category(bigint, uuid, text)
from public, anon, authenticated;

create or replace function private.capture_monthly_ranking_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.refresh_monthly_ranking_category(new.walk_id, new.dog_id, 'distance');
  perform private.refresh_monthly_ranking_category(new.walk_id, new.dog_id, 'waltzes');
  return new;
end;
$$;

revoke all on function private.capture_monthly_ranking_change() from public, anon, authenticated;

create function private.capture_monthly_places_ranking_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed record;
begin
  for changed in
    select distinct np.walk_id, wd.dog_id
    from new_places np
    join public.walk_dogs wd on wd.walk_id = np.walk_id
  loop
    perform private.refresh_monthly_ranking_category(changed.walk_id, changed.dog_id, 'places');
  end loop;
  return null;
end;
$$;

revoke all on function private.capture_monthly_places_ranking_change()
from public, anon, authenticated;

-- Realistic September discoveries give the community dogs a Places league too.
with desired_places as (
  select * from (values
    ('10000000-0000-4000-8000-000000000001'::uuid, 1),
    ('10000000-0000-4000-8000-000000000002'::uuid, 2),
    ('10000000-0000-4000-8000-000000000003'::uuid, 4),
    ('10000000-0000-4000-8000-000000000004'::uuid, 3),
    ('10000000-0000-4000-8000-000000000005'::uuid, 5),
    ('10000000-0000-4000-8000-000000000006'::uuid, 6),
    ('10000000-0000-4000-8000-000000000007'::uuid, 3),
    ('10000000-0000-4000-8000-000000000008'::uuid, 7),
    ('10000000-0000-4000-8000-000000000009'::uuid, 4)
  ) as counts(dog_id, place_count)
),
place_catalog as (
  select * from (values
    (1, 'centennial-park|nsw|2021', 'Centennial Park'),
    (2, 'bondi-beach|nsw|2026', 'Bondi Beach'),
    (3, 'hyde-park|nsw|2000', 'Hyde Park'),
    (4, 'barangaroo-reserve|nsw|2000', 'Barangaroo Reserve'),
    (5, 'rushcutters-bay-park|nsw|2011', 'Rushcutters Bay Park'),
    (6, 'cooper-park|nsw|2025', 'Cooper Park'),
    (7, 'queens-park|nsw|2022', 'Queens Park')
  ) as places(place_number, place_key, place_name)
),
mock_walks as (
  select
    wd.dog_id,
    w.id as walk_id,
    w.user_id,
    row_number() over (partition by wd.dog_id order by w.ended_at, w.id)::integer as walk_number
  from public.walks w
  join public.walk_dogs wd on wd.walk_id = w.id
  join desired_places dp on dp.dog_id = wd.dog_id
  where w.is_mock = true
    and w.ended_at >= timestamptz '2026-08-31 14:00:00+00'
    and w.ended_at < timestamptz '2026-09-30 14:00:00+00'
)
insert into public.walk_places (
  walk_id, user_id, place_key, place_name, region, country_code, distance_meters, visit_order
)
select
  mw.walk_id,
  mw.user_id,
  pc.place_key,
  pc.place_name,
  'NSW',
  'AU',
  0,
  pc.place_number
from desired_places dp
join place_catalog pc on pc.place_number <= dp.place_count
join mock_walks mw
  on mw.dog_id = dp.dog_id
 and mw.walk_number = ((pc.place_number - 1) % 3) + 1
on conflict (walk_id, place_key) do nothing;

-- Preserve the existing distance event while making its league explicit.
update public.activity_events
set metadata = metadata || jsonb_build_object('category', 'distance')
where event_type = 'ranking_climbed' and not metadata ? 'category';

-- Rebuild the current snapshots for all three leagues after adding mock places.
delete from private.monthly_ranking_snapshots
where period_key = to_char(now() at time zone 'Australia/Sydney', 'YYYY-MM');

insert into private.monthly_ranking_snapshots (
  period_key, category, dog_id, rank, distance_km, walk_count, places_count, updated_at
)
select
  to_char(now() at time zone 'Australia/Sydney', 'YYYY-MM'),
  categories.category,
  rankings.dog_id,
  case categories.category
    when 'distance' then rankings.distance_rank
    when 'waltzes' then rankings.waltzes_rank
    else rankings.places_rank
  end,
  rankings.distance_km,
  rankings.walk_count,
  rankings.places_count,
  now()
from private.monthly_dog_rankings(now()) rankings
cross join (values ('distance'), ('waltzes'), ('places')) categories(category);

create trigger monthly_ranking_change_trigger
after insert on public.walk_dogs
for each row execute function private.capture_monthly_ranking_change();

create trigger monthly_places_ranking_change_trigger
after insert on public.walk_places
referencing new table as new_places
for each statement execute function private.capture_monthly_places_ranking_change();
