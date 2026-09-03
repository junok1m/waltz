alter table public.activity_events
  add column if not exists hidden_from_profile boolean not null default false;

grant update (hidden_from_profile) on public.activity_events to authenticated;

drop policy if exists "Owners can hide their dogs activity" on public.activity_events;
create policy "Owners can hide their dogs activity"
on public.activity_events for update
to authenticated
using (
  exists (
    select 1
    from public.dogs d
    where d.id = activity_events.dog_id
      and d.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.dogs d
    where d.id = activity_events.dog_id
      and d.owner_id = (select auth.uid())
  )
);

create index if not exists activity_events_profile_cursor_idx
  on public.activity_events (dog_id, created_at desc, id desc)
  where hidden_from_profile is false;
