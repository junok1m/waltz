-- Keep the demo feed useful for visual QA by exercising each public privacy state.
with ranked_mock_walks as (
  select w.id, row_number() over (partition by wd.dog_id order by w.ended_at desc) as position
  from public.walks w
  join public.walk_dogs wd on wd.walk_id = w.id
  where w.is_mock = true
    and w.share_route = true
    and wd.dog_id::text like '10000000-0000-4000-8000-%'
)
update public.walks w
set route_visibility = case ranked.position % 5
      when 2 then 'stats_only'
      when 4 then 'hidden_ends'
      else 'full'
    end,
    route_points = case ranked.position % 5
      when 2 then '[]'::jsonb
      when 4 then (
        select coalesce(jsonb_agg(point order by ordinal), '[]'::jsonb)
        from jsonb_array_elements(w.route_points) with ordinality as route(point, ordinal)
        where ordinal > 1 and ordinal < jsonb_array_length(w.route_points)
      )
      else w.route_points
    end
from ranked_mock_walks ranked
where w.id = ranked.id;
