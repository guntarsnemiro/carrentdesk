-- Customer accept/decline token flow
alter table public.inquiries
  add column if not exists response_token uuid not null default gen_random_uuid(),
  add column if not exists customer_response text check (customer_response in ('accepted', 'declined')),
  add column if not exists customer_response_at timestamptz;

-- Unique index so we can look up by token quickly
create unique index if not exists inquiries_response_token_idx on public.inquiries (response_token);
