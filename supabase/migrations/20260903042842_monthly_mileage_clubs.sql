-- Mileage clubs now reset monthly alongside the rest of Achievements.
-- Remove the retired lifetime milestones; current-month clubs are awarded by
-- the client from monthly walk totals on the next saved walk.

delete from public.activity_events
where event_type = 'badge_earned'
  and badge_id like 'mileage-%';

delete from public.dog_badges
where badge_type = 'mileage'
   or badge_id like 'mileage-%';
