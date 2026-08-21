drop policy if exists "Owners can view their dog badges" on public.dog_badges;
create policy "Owners can view their dog badges"
on public.dog_badges for select
to authenticated
using (exists (
  select 1 from public.dogs
  where dogs.id = dog_badges.dog_id
    and dogs.owner_id = (select auth.uid())
));

drop policy if exists "Owners can earn badges for their dogs" on public.dog_badges;
create policy "Owners can earn badges for their dogs"
on public.dog_badges for insert
to authenticated
with check (exists (
  select 1 from public.dogs
  where dogs.id = dog_badges.dog_id
    and dogs.owner_id = (select auth.uid())
));
