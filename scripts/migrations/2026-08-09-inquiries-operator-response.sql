-- Add operator quote response fields to inquiries.
-- Safe to re-run (IF NOT EXISTS).

alter table public.inquiries
  add column if not exists operator_response     text,
  add column if not exists quoted_price          numeric(10,2),
  add column if not exists operator_response_at  timestamptz;
