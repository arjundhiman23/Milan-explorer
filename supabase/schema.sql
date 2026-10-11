-- Milan Explorer · Supabase schema
-- Run in the SQL editor of your project. Everything is per-user and private.

create table if not exists public.places (
  id text primary key,
  name text not null,
  category text not null,
  lat double precision not null,
  lng double precision not null,
  address text,
  short_description text,
  neighbourhood text,
  hours text,
  website text,
  price_level int,
  photo text,
  source text not null default 'curated',
  source_updated_at text,
  tags text[],
  updated_at timestamptz not null default now()
);

create table if not exists public.user_places (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id text not null references public.places(id),
  verdict text not null check (verdict in ('want','again','once','never')),
  saved_at text,
  visited_at text,
  rating int check (rating between 1 and 5),
  note text,
  tags text[],
  photo_uris text[],
  created_at text not null,
  updated_at text not null,
  deleted_at text,
  primary key (user_id, place_id)
);

create table if not exists public.bases (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  lat double precision not null,
  lng double precision not null,
  is_default boolean default false,
  primary key (user_id, id)
);

alter table public.places enable row level security;
alter table public.user_places enable row level security;
alter table public.bases enable row level security;

-- Places are shared reference data (curated + OSM search results); any signed-in
-- user may read and add them, but personal data stays strictly per-user.
create policy "places readable by authenticated" on public.places for select to authenticated using (true);
create policy "places insertable by authenticated" on public.places for insert to authenticated with check (true);
create policy "places updatable by authenticated" on public.places for update to authenticated using (true);

create policy "own user_places" on public.user_places for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own bases" on public.bases for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Private photo bucket: path is <user_id>/<place_id>/<file>.jpg
insert into storage.buckets (id, name, public) values ('visit-photos', 'visit-photos', false)
  on conflict (id) do nothing;

create policy "own photos read" on storage.objects for select to authenticated
  using (bucket_id = 'visit-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own photos write" on storage.objects for insert to authenticated
  with check (bucket_id = 'visit-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own photos delete" on storage.objects for delete to authenticated
  using (bucket_id = 'visit-photos' and (storage.foldername(name))[1] = auth.uid()::text);
