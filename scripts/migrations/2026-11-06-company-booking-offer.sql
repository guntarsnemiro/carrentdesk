-- Rental online-offer setup: places, insurance, extras, deposit rules, length rates.

alter table public.locations
  add column if not exists name text,
  add column if not exists pickup_allowed boolean not null default true,
  add column if not exists return_allowed boolean not null default true,
  add column if not exists delivery_fee numeric(10, 2),
  add column if not exists opens_at time,
  add column if not exists closes_at time,
  add column if not exists after_hours_fee numeric(10, 2);

alter table public.vehicles
  add column if not exists rate_1_day numeric(10, 2),
  add column if not exists rate_2_3_day numeric(10, 2),
  add column if not exists rate_4_6_day numeric(10, 2),
  add column if not exists rate_weekly numeric(10, 2),
  add column if not exists rate_monthly numeric(10, 2);

update public.vehicles
set rate_1_day = daily_rate
where rate_1_day is null and daily_rate is not null;

create table if not exists public.company_booking_offers (
  company_id uuid primary key references public.companies (id) on delete cascade,
  deposit_required boolean not null default true,
  deposit_amount numeric(10, 2),
  credit_card_required boolean not null default true,
  pay_cash boolean not null default true,
  pay_card boolean not null default true,
  pay_transfer boolean not null default false,
  min_driver_age integer not null default 21,
  young_driver_max_age integer,
  young_driver_price_per_day numeric(10, 2),
  km_per_day integer,
  extra_km_price numeric(10, 2),
  weekly_km_cap integer,
  monthly_km_cap integer,
  fuel_policy text not null default 'full_to_full',
  min_rental_days integer not null default 1,
  one_way_fee numeric(10, 2),
  prices_include_vat boolean not null default true,
  free_cancel_hours integer,
  winter_tires_included boolean not null default false,
  cross_border_allowed boolean not null default false,
  cross_border_price numeric(10, 2),
  cross_border_price_kind text not null default 'flat',
  cross_border_countries text[] not null default '{}',
  child_seat_price_per_day numeric(10, 2),
  additional_driver_price_per_day numeric(10, 2),
  gps_price_per_day numeric(10, 2),
  airport_delivery_price numeric(10, 2),
  updated_at timestamptz not null default now(),
  constraint company_booking_offers_fuel_check check (fuel_policy in ('full_to_full', 'full_to_empty', 'same_to_same')),
  constraint company_booking_offers_border_kind_check check (cross_border_price_kind in ('flat', 'per_day')),
  constraint company_booking_offers_age_check check (min_driver_age between 18 and 99),
  constraint company_booking_offers_min_days_check check (min_rental_days >= 1)
);

create table if not exists public.company_insurance_options (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  code text not null,
  label text not null,
  price numeric(10, 2) not null default 0,
  price_kind text not null default 'per_day',
  excess numeric(10, 2) not null default 0,
  constraint company_insurance_options_code_key unique (company_id, code),
  constraint company_insurance_code_check check (code in ('none', 'partial', 'full')),
  constraint company_insurance_kind_check check (price_kind in ('per_day', 'flat'))
);

alter table public.company_booking_offers enable row level security;
alter table public.company_insurance_options enable row level security;

drop policy if exists "offer member select" on public.company_booking_offers;
create policy "offer member select"
  on public.company_booking_offers for select
  using (exists (
    select 1 from public.company_members cm
    where cm.company_id = company_booking_offers.company_id and cm.user_id = auth.uid()
  ));

drop policy if exists "offer member insert" on public.company_booking_offers;
create policy "offer member insert"
  on public.company_booking_offers for insert
  with check (exists (
    select 1 from public.company_members cm
    where cm.company_id = company_booking_offers.company_id and cm.user_id = auth.uid()
  ));

drop policy if exists "offer member update" on public.company_booking_offers;
create policy "offer member update"
  on public.company_booking_offers for update
  using (exists (
    select 1 from public.company_members cm
    where cm.company_id = company_booking_offers.company_id and cm.user_id = auth.uid()
  ));

drop policy if exists "insurance member select" on public.company_insurance_options;
create policy "insurance member select"
  on public.company_insurance_options for select
  using (exists (
    select 1 from public.company_members cm
    where cm.company_id = company_insurance_options.company_id and cm.user_id = auth.uid()
  ));

drop policy if exists "insurance member insert" on public.company_insurance_options;
create policy "insurance member insert"
  on public.company_insurance_options for insert
  with check (exists (
    select 1 from public.company_members cm
    where cm.company_id = company_insurance_options.company_id and cm.user_id = auth.uid()
  ));

drop policy if exists "insurance member update" on public.company_insurance_options;
create policy "insurance member update"
  on public.company_insurance_options for update
  using (exists (
    select 1 from public.company_members cm
    where cm.company_id = company_insurance_options.company_id and cm.user_id = auth.uid()
  ));

drop policy if exists "insurance member delete" on public.company_insurance_options;
create policy "insurance member delete"
  on public.company_insurance_options for delete
  using (exists (
    select 1 from public.company_members cm
    where cm.company_id = company_insurance_options.company_id and cm.user_id = auth.uid()
  ));
