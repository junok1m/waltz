-- Nine stable community dogs and twelve believable Sydney walks for each dog.
-- Stable UUIDs and per-dog walk counts make this safe to run more than once.

insert into public.dogs
  (id, owner_id, name, birth_year, birth_month, birth_day, breed, sex, weight_kg, profile_line)
values
  ('10000000-0000-4000-8000-000000000001', 'b97b0e25-1a05-4554-949b-53268917d032', 'Milo',    2021, 3, 14, 'Cavoodle',              'male',   7.2, 'Professional leaf inspector'),
  ('10000000-0000-4000-8000-000000000002', 'b97b0e25-1a05-4554-949b-53268917d032', 'Luna',    2020, 8, 22, 'Border Collie',         'female', 18.4, 'Fast feet, soft heart'),
  ('10000000-0000-4000-8000-000000000003', 'b97b0e25-1a05-4554-949b-53268917d032', 'Mochi',   2022, 11, 3, 'Shiba Inu',            'female',  9.1, 'Selective listener, elite sniffer'),
  ('10000000-0000-4000-8000-000000000004', 'd7a1e041-cc5e-4391-9e0e-bdd84a4f1431', 'Archie',  2019, 5, 18, 'Golden Retriever',     'male',   31.0, 'Carries one excellent stick'),
  ('10000000-0000-4000-8000-000000000005', 'd7a1e041-cc5e-4391-9e0e-bdd84a4f1431', 'Nala',    2021, 9, 27, 'French Bulldog',       'female', 11.2, 'Short walks, big opinions'),
  ('10000000-0000-4000-8000-000000000006', 'd7a1e041-cc5e-4391-9e0e-bdd84a4f1431', 'Pepper',  2020, 1, 9,  'Miniature Schnauzer',   'female',  8.0, 'Mayor of the neighbourhood'),
  ('10000000-0000-4000-8000-000000000007', '01f401ef-8d1a-4900-8a17-af97ccfb50c3', 'Teddy',   2018, 7, 12, 'Groodle',               'male',   22.0, 'Always ready for the long way home'),
  ('10000000-0000-4000-8000-000000000008', '01f401ef-8d1a-4900-8a17-af97ccfb50c3', 'Coco',    2022, 4, 5,  'Pembroke Welsh Corgi', 'female', 12.5, 'Tiny legs, enormous itinerary'),
  ('10000000-0000-4000-8000-000000000009', '01f401ef-8d1a-4900-8a17-af97ccfb50c3', 'Biscuit', 2019, 12, 1, 'Beagle',                'male',   14.0, 'Follows every interesting smell')
on conflict (id) do update set
  owner_id = excluded.owner_id,
  name = excluded.name,
  birth_year = excluded.birth_year,
  birth_month = excluded.birth_month,
  birth_day = excluded.birth_day,
  breed = excluded.breed,
  sex = excluded.sex,
  weight_kg = excluded.weight_kg,
  profile_line = excluded.profile_line;

do $$
declare
  dog_record record;
  walk_number integer;
  existing_walks integer;
  new_walk_id bigint;
  walk_distance double precision;
  base_lat double precision;
  base_lng double precision;
  walk_title text;
  walk_tags text[];
begin
  for dog_record in
    select * from (values
      ('10000000-0000-4000-8000-000000000001'::uuid, 'b97b0e25-1a05-4554-949b-53268917d032'::uuid, 'Milo',    1, -33.8972, 151.2354),
      ('10000000-0000-4000-8000-000000000002'::uuid, 'b97b0e25-1a05-4554-949b-53268917d032'::uuid, 'Luna',    2, -33.8625, 151.1510),
      ('10000000-0000-4000-8000-000000000003'::uuid, 'b97b0e25-1a05-4554-949b-53268917d032'::uuid, 'Mochi',   3, -33.9101, 151.1852),
      ('10000000-0000-4000-8000-000000000004'::uuid, 'd7a1e041-cc5e-4391-9e0e-bdd84a4f1431'::uuid, 'Archie',  4, -33.9581, 151.1560),
      ('10000000-0000-4000-8000-000000000005'::uuid, 'd7a1e041-cc5e-4391-9e0e-bdd84a4f1431'::uuid, 'Nala',    5, -33.8330, 151.1282),
      ('10000000-0000-4000-8000-000000000006'::uuid, 'd7a1e041-cc5e-4391-9e0e-bdd84a4f1431'::uuid, 'Pepper',  6, -33.9090, 151.1530),
      ('10000000-0000-4000-8000-000000000007'::uuid, '01f401ef-8d1a-4900-8a17-af97ccfb50c3'::uuid, 'Teddy',   7, -33.7751, 151.1122),
      ('10000000-0000-4000-8000-000000000008'::uuid, '01f401ef-8d1a-4900-8a17-af97ccfb50c3'::uuid, 'Coco',    8, -33.8132, 151.0103),
      ('10000000-0000-4000-8000-000000000009'::uuid, '01f401ef-8d1a-4900-8a17-af97ccfb50c3'::uuid, 'Biscuit', 9, -33.9260, 151.1542)
    ) as seed(dog_id, owner_id, dog_name, seed_number, latitude, longitude)
  loop
    select count(*) into existing_walks
    from public.walk_dogs wd
    join public.walks w on w.id = wd.walk_id
    where wd.dog_id = dog_record.dog_id and w.is_mock = true;

    if existing_walks < 12 then
      for walk_number in existing_walks + 1..12 loop
        walk_distance := round((1.2 + ((walk_number * 7 + dog_record.seed_number * 3) % 58) / 10.0)::numeric, 2)::double precision;
        base_lat := dog_record.latitude + ((walk_number % 3) - 1) * 0.0011;
        base_lng := dog_record.longitude + ((walk_number % 4) - 2) * 0.0010;
        walk_title := (array[
          'Morning sniffari', 'Coffee stop loop', 'Sunset zoomies',
          'Creek-side waltz', 'Long leash adventure', 'Neighbourhood patrol'
        ])[1 + ((walk_number + dog_record.seed_number) % 6)];
        walk_tags := case walk_number % 5
          when 0 then array['trail']::text[]
          when 1 then array['coffee']::text[]
          when 2 then array['swim']::text[]
          else array[]::text[]
        end;

        insert into public.walks
          (user_id, dog_name, title, distance_km, duration_seconds, ended_at,
           route_points, share_route, tags, is_mock, hidden_from_profile)
        values
          (dog_record.owner_id, dog_record.dog_name, walk_title, walk_distance,
           round(walk_distance * (690 + ((walk_number + dog_record.seed_number) % 7) * 35))::integer,
           now() - make_interval(days => walk_number * 2 + dog_record.seed_number % 3,
                                 hours => 6 + ((walk_number + dog_record.seed_number) % 12)),
           jsonb_build_array(
             jsonb_build_object('latitude', base_lat,          'longitude', base_lng),
             jsonb_build_object('latitude', base_lat + 0.0018, 'longitude', base_lng + 0.0012),
             jsonb_build_object('latitude', base_lat + 0.0026, 'longitude', base_lng - 0.0009),
             jsonb_build_object('latitude', base_lat + 0.0004, 'longitude', base_lng - 0.0015),
             jsonb_build_object('latitude', base_lat,          'longitude', base_lng)
           ),
           walk_number % 6 <> 0,
           walk_tags,
           true,
           false)
        returning id into new_walk_id;

        insert into public.walk_dogs (walk_id, dog_id)
        values (new_walk_id, dog_record.dog_id);
      end loop;
    end if;
  end loop;
end
$$;

-- Seed a small web of cross-household appreciation on the newest shared walks.
do $$
declare
  boop_record record;
  target_walk_id bigint;
begin
  for boop_record in
    select * from (values
      ('10000000-0000-4000-8000-000000000001'::uuid, 'b97b0e25-1a05-4554-949b-53268917d032'::uuid, '10000000-0000-4000-8000-000000000004'::uuid),
      ('10000000-0000-4000-8000-000000000002'::uuid, 'b97b0e25-1a05-4554-949b-53268917d032'::uuid, '10000000-0000-4000-8000-000000000007'::uuid),
      ('10000000-0000-4000-8000-000000000003'::uuid, 'b97b0e25-1a05-4554-949b-53268917d032'::uuid, '10000000-0000-4000-8000-000000000005'::uuid),
      ('10000000-0000-4000-8000-000000000004'::uuid, 'd7a1e041-cc5e-4391-9e0e-bdd84a4f1431'::uuid, '10000000-0000-4000-8000-000000000008'::uuid),
      ('10000000-0000-4000-8000-000000000005'::uuid, 'd7a1e041-cc5e-4391-9e0e-bdd84a4f1431'::uuid, '10000000-0000-4000-8000-000000000001'::uuid),
      ('10000000-0000-4000-8000-000000000006'::uuid, 'd7a1e041-cc5e-4391-9e0e-bdd84a4f1431'::uuid, '10000000-0000-4000-8000-000000000009'::uuid),
      ('10000000-0000-4000-8000-000000000007'::uuid, '01f401ef-8d1a-4900-8a17-af97ccfb50c3'::uuid, '10000000-0000-4000-8000-000000000002'::uuid),
      ('10000000-0000-4000-8000-000000000008'::uuid, '01f401ef-8d1a-4900-8a17-af97ccfb50c3'::uuid, '10000000-0000-4000-8000-000000000006'::uuid),
      ('10000000-0000-4000-8000-000000000009'::uuid, '01f401ef-8d1a-4900-8a17-af97ccfb50c3'::uuid, '10000000-0000-4000-8000-000000000003'::uuid)
    ) as seed(from_dog_id, owner_id, target_dog_id)
  loop
    select w.id into target_walk_id
    from public.walks w
    join public.walk_dogs wd on wd.walk_id = w.id
    where wd.dog_id = boop_record.target_dog_id
      and w.is_mock = true
      and w.share_route = true
    order by w.ended_at desc
    limit 1;

    if target_walk_id is not null then
      perform set_config('request.jwt.claim.sub', boop_record.owner_id::text, true);
      insert into public.boops (from_dog_id, to_dog_id, walk_id)
      values (boop_record.from_dog_id, boop_record.target_dog_id, target_walk_id)
      on conflict (from_dog_id, walk_id) do nothing;
    end if;
  end loop;
end
$$;
