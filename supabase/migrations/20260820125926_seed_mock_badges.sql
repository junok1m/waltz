-- Deterministic badge history for the nine community seed dogs.
with badge_seed(dog_id, badge_id, earned_at) as (
  values
    ('10000000-0000-4000-8000-000000000001'::uuid, 'gone-fishing', now() - interval '3 days 2 hours'),
    ('10000000-0000-4000-8000-000000000001'::uuid, 'tiny-adventures', now() - interval '18 days'),
    ('10000000-0000-4000-8000-000000000002'::uuid, 'early-bird', now() - interval '5 days 4 hours'),
    ('10000000-0000-4000-8000-000000000002'::uuid, 'mileage-100', now() - interval '24 days'),
    ('10000000-0000-4000-8000-000000000003'::uuid, 'night-shift', now() - interval '7 days 1 hour'),
    ('10000000-0000-4000-8000-000000000003'::uuid, 'trail', now() - interval '21 days'),
    ('10000000-0000-4000-8000-000000000004'::uuid, 'mileage-100', now() - interval '4 days 3 hours'),
    ('10000000-0000-4000-8000-000000000004'::uuid, 'gone-fishing', now() - interval '16 days'),
    ('10000000-0000-4000-8000-000000000005'::uuid, 'tiny-adventures', now() - interval '6 days 2 hours'),
    ('10000000-0000-4000-8000-000000000005'::uuid, 'coffee-stop', now() - interval '26 days'),
    ('10000000-0000-4000-8000-000000000006'::uuid, 'mileage-100', now() - interval '2 days 5 hours'),
    ('10000000-0000-4000-8000-000000000006'::uuid, 'keep-flame', now() - interval '13 days'),
    ('10000000-0000-4000-8000-000000000007'::uuid, 'mileage-500', now() - interval '8 days'),
    ('10000000-0000-4000-8000-000000000007'::uuid, 'trail', now() - interval '23 days'),
    ('10000000-0000-4000-8000-000000000008'::uuid, 'early-bird', now() - interval '9 days 2 hours'),
    ('10000000-0000-4000-8000-000000000008'::uuid, 'tiny-adventures', now() - interval '19 days'),
    ('10000000-0000-4000-8000-000000000009'::uuid, 'trail', now() - interval '10 days 3 hours'),
    ('10000000-0000-4000-8000-000000000009'::uuid, 'mileage-100', now() - interval '28 days')
)
insert into public.dog_badges (dog_id, badge_id, badge_type, period_key, earned_at)
select
  dog_id,
  badge_id,
  case when badge_id like 'mileage-%' then 'mileage' else 'monthly' end,
  case when badge_id like 'mileage-%' then 'permanent' else to_char(earned_at at time zone 'Australia/Sydney', 'YYYY-MM') end,
  earned_at
from badge_seed
on conflict (dog_id, badge_id, period_key) do nothing;
