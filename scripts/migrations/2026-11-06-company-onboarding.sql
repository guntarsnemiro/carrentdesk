-- Separate public listing from a company that is still setting up.
-- Existing companies stay on the city pages.

alter table public.companies
  add column if not exists listed_at timestamptz,
  add column if not exists onboarding_step smallint not null default 0;

alter table public.companies
  drop constraint if exists companies_onboarding_step_check;

alter table public.companies
  add constraint companies_onboarding_step_check
  check (onboarding_step between 0 and 6);

update public.companies
set listed_at = coalesce(listed_at, created_at, now()),
    onboarding_step = 6
where listed_at is null;
