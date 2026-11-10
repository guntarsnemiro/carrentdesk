-- City delivery price, canonical airport places, and search demand.

alter table public.company_booking_offers
  add column if not exists city_delivery_enabled boolean not null default false,
  add column if not exists city_delivery_price numeric(10, 2);

alter table public.locations
  add column if not exists kind text not null default 'office',
  add column if not exists iata_code text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'locations_kind_check'
  ) then
    alter table public.locations
      add constraint locations_kind_check check (kind in ('office', 'airport'));
  end if;
end $$;

create unique index if not exists locations_company_iata_uidx
  on public.locations (company_id, iata_code)
  where iata_code is not null;

create table if not exists public.search_demand (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  city_slug text not null,
  pickup_date date,
  return_date date,
  pickup_time text,
  return_time text,
  place_kind text,
  place_code text,
  place_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint search_demand_session_city_key unique (session_id, city_slug),
  constraint search_demand_place_kind_check check (
    place_kind is null or place_kind in ('airport', 'city', 'office')
  )
);

create index if not exists search_demand_city_idx
  on public.search_demand (city_slug, pickup_date);

alter table public.search_demand enable row level security;
