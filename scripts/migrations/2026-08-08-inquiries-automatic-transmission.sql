-- Add automatic_transmission column to inquiries.
-- Safe to re-run (IF NOT EXISTS).

alter table public.inquiries
  add column if not exists automatic_transmission boolean not null default false;
