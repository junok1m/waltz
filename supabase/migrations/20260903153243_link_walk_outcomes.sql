alter table public.activity_events
  drop constraint if exists activity_events_event_type_check;

alter table public.activity_events
  add constraint activity_events_event_type_check
  check (event_type in (
    'boop_received',
    'badge_earned',
    'shared_walk',
    'area_unlocked',
    'local_legend',
    'challenge_complete',
    'ranking_climbed',
    'places_discovered'
  ));

drop trigger if exists badge_activity_trigger on public.dog_badges;
drop function if exists public.create_badge_activity();

create function private.create_badge_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_walk_id bigint;
begin
  if new.badge_type <> 'limited' then
    select w.id into source_walk_id
    from public.walks w
    join public.walk_dogs wd on wd.walk_id = w.id
    where wd.dog_id = new.dog_id
      and to_char(w.ended_at at time zone 'Australia/Sydney', 'YYYY-MM') = new.period_key
      and w.ended_at <= new.earned_at
    order by w.ended_at desc, w.id desc
    limit 1;
  end if;

  insert into public.activity_events (
    dog_id, event_type, walk_id, badge_id, metadata, created_at
  ) values (
    new.dog_id,
    'badge_earned',
    source_walk_id,
    new.badge_id,
    jsonb_build_object(
      'badge_id', new.badge_id,
      'badge_type', new.badge_type,
      'period_key', new.period_key
    ),
    new.earned_at
  );

  return new;
end;
$$;

revoke all on function private.create_badge_activity() from public, anon, authenticated;

create trigger badge_activity_trigger
after insert on public.dog_badges
for each row execute function private.create_badge_activity();

create function private.capture_walk_place_discoveries()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed record;
begin
  for changed in
    select
      candidate.walk_id,
      candidate.dog_id,
      count(*)::integer as place_count,
      jsonb_agg(candidate.place_name order by candidate.visit_order) as place_names
    from (
      select distinct on (np.walk_id, wd.dog_id, np.place_key)
        np.walk_id,
        wd.dog_id,
        np.place_key,
        np.place_name,
        np.visit_order
      from new_places np
      join public.walk_dogs wd on wd.walk_id = np.walk_id
      where not exists (
        select 1
        from public.walk_places previous_place
        join public.walk_dogs previous_dog on previous_dog.walk_id = previous_place.walk_id
        where previous_dog.dog_id = wd.dog_id
          and previous_place.place_key = np.place_key
          and previous_place.walk_id <> np.walk_id
      )
      order by np.walk_id, wd.dog_id, np.place_key, np.visit_order
    ) candidate
    group by candidate.walk_id, candidate.dog_id
  loop
    insert into public.activity_events (
      dog_id, event_type, walk_id, metadata, created_at
    )
    select
      changed.dog_id,
      'places_discovered',
      changed.walk_id,
      jsonb_build_object(
        'place_count', changed.place_count,
        'place_names', changed.place_names
      ),
      w.ended_at
    from public.walks w
    where w.id = changed.walk_id
      and changed.place_count > 0;
  end loop;

  return null;
end;
$$;

revoke all on function private.capture_walk_place_discoveries() from public, anon, authenticated;

drop trigger if exists walk_places_discovery_activity_trigger on public.walk_places;
create trigger walk_places_discovery_activity_trigger
after insert on public.walk_places
referencing new table as new_places
for each statement execute function private.capture_walk_place_discoveries();
