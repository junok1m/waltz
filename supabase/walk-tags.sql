alter table public.walks
  add column if not exists tags text[] not null default '{}';
