-- Online checkout details the office should see, kept out of bookings.notes.

alter table public.bookings
  add column if not exists customer_request text,
  add column if not exists flight_number text;

comment on column public.bookings.customer_request is
  'Text the customer typed at online checkout. Office notes stay in bookings.notes.';
comment on column public.bookings.flight_number is
  'Flight number from online checkout.';
