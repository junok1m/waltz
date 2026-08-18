-- Waltz MVP: persist completed GPS routes and whether the owner chose to share them.
-- Run once in the Supabase SQL Editor before testing route saves.

alter table public.walks
  add column if not exists route_points jsonb not null default '[]'::jsonb,
  add column if not exists share_route boolean not null default false;

comment on column public.walks.route_points is 'Ordered GPS points for the completed walk, stored as [{latitude, longitude}, ...].';
comment on column public.walks.share_route is 'Owner opt-in to let friends/community see this completed route. This is not live location sharing.';
