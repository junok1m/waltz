-- Monthly sticker-book badges, permanent mileage clubs, and permanent limited awards.

alter table public.dog_badges
  add column if not exists badge_type text,
  add column if not exists period_key text;

update public.dog_badges
set
  badge_type = case
    when badge_id like 'mileage-%' then 'mileage'
    when badge_id like 'limited-%' then 'limited'
    else 'monthly'
  end,
  period_key = case
    when badge_id like 'mileage-%' or badge_id like 'limited-%' then 'permanent'
    else to_char(earned_at at time zone 'Australia/Sydney', 'YYYY-MM')
  end
where badge_type is null or period_key is null;

alter table public.dog_badges
  alter column badge_type set default 'monthly',
  alter column badge_type set not null,
  alter column period_key set default to_char(now() at time zone 'Australia/Sydney', 'YYYY-MM'),
  alter column period_key set not null;

alter table public.dog_badges
  drop constraint if exists dog_badges_dog_id_badge_id_key;

alter table public.dog_badges
  drop constraint if exists dog_badges_badge_type_check;

alter table public.dog_badges
  add constraint dog_badges_badge_type_check
  check (badge_type in ('monthly', 'mileage', 'limited'));

alter table public.dog_badges
  drop constraint if exists dog_badges_period_key_check;

alter table public.dog_badges
  add constraint dog_badges_period_key_check
  check (period_key = 'permanent' or period_key ~ '^\d{4}-(0[1-9]|1[0-2])$');

alter table public.dog_badges
  add constraint dog_badges_dog_badge_period_key
  unique (dog_id, badge_id, period_key);

create index if not exists dog_badges_dog_period_idx
  on public.dog_badges (dog_id, period_key, earned_at desc);

-- These milestone badges now follow the monthly rule too.
create or replace function public.after_area_unlock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  unlocked_name text;
  unlock_count integer;
  award_period text := to_char(new.unlocked_at at time zone 'Australia/Sydney', 'YYYY-MM');
begin
  select name into unlocked_name from public.areas where id = new.area_id;

  insert into public.activity_events (dog_id, event_type, walk_id, metadata, created_at)
  values (new.dog_id, 'area_unlocked', new.first_walk_id,
    jsonb_build_object('area_id', new.area_id, 'area_name', unlocked_name), new.unlocked_at);

  select count(*) into unlock_count from public.dog_area_unlocks where dog_id = new.dog_id;
  if unlock_count >= 10 then
    insert into public.dog_badges (dog_id, badge_id, badge_type, period_key, earned_at)
    values (new.dog_id, 'urban-explorer', 'monthly', award_period, new.unlocked_at)
    on conflict (dog_id, badge_id, period_key) do nothing;
  end if;
  return new;
end;
$$;

create or replace function public.after_local_legend_award()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  segment_name text;
  area_name text;
  crown_count integer;
  award_period text := to_char(new.awarded_at at time zone 'Australia/Sydney', 'YYYY-MM');
begin
  select s.name, a.name into segment_name, area_name
  from public.segments s left join public.areas a on a.id = s.area_id
  where s.id = new.segment_id;

  insert into public.activity_events (dog_id, event_type, metadata, created_at)
  values (new.dog_id, 'local_legend',
    jsonb_build_object('segment_id', new.segment_id, 'segment_name', segment_name, 'area_name', area_name),
    new.awarded_at);

  select count(*) into crown_count from public.dog_local_legend_awards where dog_id = new.dog_id;
  if crown_count >= 10 then
    insert into public.dog_badges (dog_id, badge_id, badge_type, period_key, earned_at)
    values (new.dog_id, 'local-royalty', 'monthly', award_period, new.awarded_at)
    on conflict (dog_id, badge_id, period_key) do nothing;
  end if;
  return new;
end;
$$;
