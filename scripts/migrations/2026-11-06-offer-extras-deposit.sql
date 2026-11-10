-- Extra caps, per-car deposits, and the kilometre / deposit rules the office actually sets.

alter table public.vehicles
  add column if not exists deposit_basic numeric(10, 2),
  add column if not exists deposit_partial numeric(10, 2);

alter table public.company_booking_offers
  add column if not exists child_seat_max_price numeric(10, 2),
  add column if not exists additional_driver_max_price numeric(10, 2),
  add column if not exists gps_max_price numeric(10, 2),
  add column if not exists airport_delivery_price_per_day numeric(10, 2),
  add column if not exists airport_delivery_max_price numeric(10, 2),
  add column if not exists cross_border_price_per_day numeric(10, 2),
  add column if not exists cross_border_max_price numeric(10, 2),
  add column if not exists unlimited_km boolean not null default false,
  add column if not exists deposit_pay_cash boolean not null default true,
  add column if not exists deposit_pay_card boolean not null default false,
  add column if not exists deposit_returned_when text;

-- The old airport delivery price was a single charge for the rental.
update public.company_booking_offers
set airport_delivery_max_price = airport_delivery_price
where airport_delivery_max_price is null
  and airport_delivery_price is not null;

-- A per-day cross-border price stays per day. A flat price becomes the rental cap.
update public.company_booking_offers
set cross_border_price_per_day = cross_border_price
where cross_border_price_kind = 'per_day'
  and cross_border_price_per_day is null
  and cross_border_price is not null;

update public.company_booking_offers
set cross_border_max_price = cross_border_price
where cross_border_price_kind = 'flat'
  and cross_border_max_price is null
  and cross_border_price is not null;

alter table public.company_booking_offers
  alter column credit_card_required set default false;
