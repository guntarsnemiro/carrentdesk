-- A listing can stay bookable after one rental when the office has several of the same car.

alter table public.vehicles
  add column if not exists always_available boolean not null default false;

comment on column public.vehicles.always_available is
  'When true, one booking does not remove this car from search. Use when several cars share this listing.';
