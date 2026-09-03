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
    'ranking_climbed'
  ));
