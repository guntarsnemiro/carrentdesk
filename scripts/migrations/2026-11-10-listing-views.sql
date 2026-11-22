-- Anonymous opens of a rental's public page. One row per browser and company.

create table if not exists public.listing_views (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  company_id uuid not null references public.companies (id) on delete cascade,
  company_slug text not null,
  city_slug text,
  views integer not null default 1 check (views > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listing_views_session_company_key unique (session_id, company_id)
);

create index if not exists listing_views_company_idx
  on public.listing_views (company_slug);

alter table public.listing_views enable row level security;

comment on table public.listing_views is
  'Anonymous visits to /c/[slug]. No name or contact details.';
