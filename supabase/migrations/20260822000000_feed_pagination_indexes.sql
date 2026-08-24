create index if not exists walks_shared_feed_cursor_idx
  on public.walks (ended_at desc, id desc)
  where share_route is true and hidden_from_profile is false;

create index if not exists activity_events_badge_feed_cursor_idx
  on public.activity_events (created_at desc, id desc)
  where event_type = 'badge_earned' and badge_id is not null;
