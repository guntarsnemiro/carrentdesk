-- One confirmation email to the customer and one to the rental.
-- The customer cancel link keeps the confirmation fee.

alter table public.bookings
  add column if not exists confirmation_sent_at timestamptz,
  add column if not exists cancel_notice_sent_at timestamptz,
  add column if not exists customer_cancel_token text;

create unique index if not exists bookings_customer_cancel_token_key
  on public.bookings (customer_cancel_token)
  where customer_cancel_token is not null;

comment on column public.bookings.confirmation_sent_at is
  'When the confirmed-booking emails were claimed. Stops a second send.';
comment on column public.bookings.cancel_notice_sent_at is
  'When the cancellation emails were claimed. Stops a second send.';
comment on column public.bookings.customer_cancel_token is
  'Secret token for the customer cancel link. Cancelling keeps the confirmation fee.';
