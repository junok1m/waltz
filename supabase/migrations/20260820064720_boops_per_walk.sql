-- Make Boops activity-level kudos: one Boop per dog, per shared walk.

alter table public.boops
  add column if not exists walk_id bigint references public.walks(id) on delete cascade;

-- The table is empty in the current project, so every future Boop must target a walk.
alter table public.boops
  alter column walk_id set not null;

alter table public.boops
  drop constraint if exists boops_one_per_walk;

alter table public.boops
  add constraint boops_one_per_walk unique (from_dog_id, walk_id);

create index if not exists boops_walk_id_idx
  on public.boops (walk_id, created_at desc);

create index if not exists activity_events_actor_dog_id_idx
  on public.activity_events (actor_dog_id);

create index if not exists activity_events_walk_id_idx
  on public.activity_events (walk_id);

-- Shared walks form the authenticated community feed.
drop policy if exists "Authenticated users can view shared walks" on public.walks;
create policy "Authenticated users can view shared walks"
on public.walks for select
to authenticated
using (share_route = true and hidden_from_profile = false);

drop policy if exists "Authenticated users can view dogs on shared walks"
on public.walk_dogs;
create policy "Authenticated users can view dogs on shared walks"
on public.walk_dogs for select
to authenticated
using (
  exists (
    select 1
    from public.walks w
    where w.id = walk_id
      and w.share_route = true
      and w.hidden_from_profile = false
  )
);

-- Retire the original pre-auth development policies now that Waltz requires login.
drop policy if exists "dev allow all" on public.walks;
drop policy if exists "dev anon insert" on public.walks;
drop policy if exists "dev anon select" on public.walks;
revoke all on public.walks from anon;

drop policy if exists "Users can boop as their own dog" on public.boops;
create policy "Users can boop shared walks as their own dog"
on public.boops for insert
to authenticated
with check (
  exists (
    select 1
    from public.dogs sender
    where sender.id = from_dog_id
      and sender.owner_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.walks w
    join public.walk_dogs wd on wd.walk_id = w.id
    join public.dogs recipient on recipient.id = wd.dog_id
    where w.id = walk_id
      and wd.dog_id = to_dog_id
      and w.share_route = true
      and w.hidden_from_profile = false
      and recipient.owner_id <> (select auth.uid())
  )
);

drop policy if exists "Users can remove their own boops" on public.boops;
create policy "Users can remove their own boops"
on public.boops for delete
to authenticated
using (
  exists (
    select 1
    from public.dogs d
    where d.id = from_dog_id
      and d.owner_id = (select auth.uid())
  )
);

create schema if not exists private;
revoke all on schema private from public;

drop trigger if exists boop_activity_trigger on public.boops;
drop trigger if exists boop_activity_delete_trigger on public.boops;
drop function if exists public.create_boop_activity();

create or replace function private.create_boop_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not exists (
    select 1
    from public.dogs d
    where d.id = new.from_dog_id
      and d.owner_id = (select auth.uid())
  ) then
    raise exception 'Not allowed to create this Boop';
  end if;

  insert into public.activity_events (
    dog_id,
    event_type,
    actor_dog_id,
    walk_id,
    metadata,
    created_at
  ) values (
    new.to_dog_id,
    'boop_received',
    new.from_dog_id,
    new.walk_id,
    jsonb_build_object('boop_id', new.id),
    new.created_at
  );

  return new;
end;
$$;

create or replace function private.remove_boop_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not exists (
    select 1
    from public.dogs d
    where d.id = old.from_dog_id
      and d.owner_id = (select auth.uid())
  ) then
    raise exception 'Not allowed to remove this Boop';
  end if;

  delete from public.activity_events
  where event_type = 'boop_received'
    and dog_id = old.to_dog_id
    and actor_dog_id = old.from_dog_id
    and walk_id = old.walk_id
    and metadata->>'boop_id' = old.id::text;

  return old;
end;
$$;

revoke all on function private.create_boop_activity() from public;
revoke all on function private.remove_boop_activity() from public;

-- Trigger functions should not also be callable as public RPC endpoints.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

create trigger boop_activity_trigger
after insert on public.boops
for each row execute function private.create_boop_activity();

create trigger boop_activity_delete_trigger
after delete on public.boops
for each row execute function private.remove_boop_activity();
