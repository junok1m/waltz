create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.monthly_ranking_snapshots (
  period_key text not null,
  dog_id uuid not null references public.dogs(id) on delete cascade,
  rank integer not null check (rank > 0),
  distance_km numeric not null check (distance_km >= 0),
  walk_count integer not null check (walk_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (period_key, dog_id)
);
revoke all on table private.monthly_ranking_snapshots from public, anon, authenticated;

create function private.capture_monthly_ranking_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  walk_ended_at timestamptz;
  award_period text;
  previous_rank integer;
  current_rank integer;
  current_distance numeric;
  current_walk_count integer;
begin
  select w.ended_at into walk_ended_at from public.walks w where w.id = new.walk_id;
  award_period := to_char(walk_ended_at at time zone 'Australia/Sydney', 'YYYY-MM');

  select s.rank into previous_rank
  from private.monthly_ranking_snapshots s
  where s.period_key = award_period and s.dog_id = new.dog_id;

  with bounds as (
    select date_trunc('month', walk_ended_at at time zone 'Australia/Sydney') at time zone 'Australia/Sydney' starts_at,
      (date_trunc('month', walk_ended_at at time zone 'Australia/Sydney') + interval '1 month') at time zone 'Australia/Sydney' ends_at
  ), totals as (
    select d.id dog_id, round(sum(w.distance_km)::numeric, 2) distance_km, count(w.id)::integer walk_count
    from public.dogs d join public.walk_dogs wd on wd.dog_id=d.id join public.walks w on w.id=wd.walk_id cross join bounds b
    where w.ended_at >= b.starts_at and w.ended_at < b.ends_at group by d.id
  ), ranked as (
    select totals.*, row_number() over (order by distance_km desc, walk_count desc, dog_id)::integer rank from totals
  )
  select r.rank, r.distance_km, r.walk_count into current_rank, current_distance, current_walk_count
  from ranked r where r.dog_id = new.dog_id;

  if previous_rank is not null and current_rank < previous_rank then
    insert into public.activity_events (dog_id,event_type,walk_id,metadata,created_at)
    values (new.dog_id,'ranking_climbed',new.walk_id,jsonb_build_object(
      'period_key',award_period,'old_rank',previous_rank,'new_rank',current_rank,
      'distance_km',current_distance,'walk_count',current_walk_count,
      'feed_visible',current_rank=1 or (current_rank<=3 and previous_rank>3)
    ),walk_ended_at);
  end if;

  with bounds as (
    select date_trunc('month', walk_ended_at at time zone 'Australia/Sydney') at time zone 'Australia/Sydney' starts_at,
      (date_trunc('month', walk_ended_at at time zone 'Australia/Sydney') + interval '1 month') at time zone 'Australia/Sydney' ends_at
  ), totals as (
    select d.id dog_id, round(sum(w.distance_km)::numeric, 2) distance_km, count(w.id)::integer walk_count
    from public.dogs d join public.walk_dogs wd on wd.dog_id=d.id join public.walks w on w.id=wd.walk_id cross join bounds b
    where w.ended_at >= b.starts_at and w.ended_at < b.ends_at group by d.id
  ), ranked as (
    select totals.*, row_number() over (order by distance_km desc, walk_count desc, dog_id)::integer rank from totals
  )
  insert into private.monthly_ranking_snapshots(period_key,dog_id,rank,distance_km,walk_count,updated_at)
  select award_period,r.dog_id,r.rank,r.distance_km,r.walk_count,now() from ranked r
  on conflict(period_key,dog_id) do update set rank=excluded.rank,distance_km=excluded.distance_km,
    walk_count=excluded.walk_count,updated_at=excluded.updated_at;

  return new;
end;
$$;
revoke all on function private.capture_monthly_ranking_change() from public, anon, authenticated;

create trigger monthly_ranking_change_trigger after insert on public.walk_dogs
for each row execute function private.capture_monthly_ranking_change();

with totals as (
  select d.id dog_id,round(sum(w.distance_km)::numeric,2) distance_km,count(w.id)::integer walk_count
  from public.dogs d join public.walk_dogs wd on wd.dog_id=d.id join public.walks w on w.id=wd.walk_id
  where to_char(w.ended_at at time zone 'Australia/Sydney','YYYY-MM')=to_char(now() at time zone 'Australia/Sydney','YYYY-MM')
  group by d.id
), ranked as (
  select totals.*,row_number() over(order by distance_km desc,walk_count desc,dog_id)::integer rank from totals
)
insert into private.monthly_ranking_snapshots(period_key,dog_id,rank,distance_km,walk_count)
select to_char(now() at time zone 'Australia/Sydney','YYYY-MM'),dog_id,rank,distance_km,walk_count from ranked;

insert into public.activity_events(dog_id,event_type,metadata,created_at)
select dog_id,'ranking_climbed',jsonb_build_object(
  'period_key',period_key,'old_rank',null,'new_rank',1,'distance_km',distance_km,'walk_count',walk_count,'feed_visible',true
),now()
from private.monthly_ranking_snapshots
where period_key=to_char(now() at time zone 'Australia/Sydney','YYYY-MM') and rank=1;
