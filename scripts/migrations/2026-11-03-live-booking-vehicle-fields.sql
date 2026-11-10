-- Live booking v1: public car fields + online booking fee columns.
-- Prerequisite: booking_status enum value 'pending_payment'.

alter table public.vehicles
  add column if not exists bookable boolean not null default false,
  add column if not exists daily_rate numeric(10, 2),
  add column if not exists photo_urls text[] not null default '{}';

comment on column public.vehicles.bookable is 'If true, this car can appear on the public booking site (make/model or similar — never show plate).';
comment on column public.vehicles.daily_rate is 'Public daily rental price in EUR. Null means not priced yet.';
comment on column public.vehicles.photo_urls is 'Public photo URLs (Supabase Storage vehicle-photos bucket).';

alter table public.bookings
  add column if not exists source text not null default 'office',
  add column if not exists listed_vehicle_id uuid references public.vehicles (id),
  add column if not exists rental_total numeric(10, 2),
  add column if not exists platform_fee numeric(10, 2),
  add column if not exists fee_paid_at timestamptz,
  add column if not exists fee_refunded_at timestamptz,
  add column if not exists stripe_session_id text,
  add column if not exists pending_expires_at timestamptz,
  add column if not exists cancel_reason text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bookings_source_check'
  ) then
    alter table public.bookings
      add constraint bookings_source_check check (source in ('office', 'online'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'bookings_cancel_reason_check'
  ) then
    alter table public.bookings
      add constraint bookings_cancel_reason_check
      check (cancel_reason is null or cancel_reason in ('unavailable', 'customer', 'operator'));
  end if;
end $$;

create unique index if not exists bookings_stripe_session_id_uidx
  on public.bookings (stripe_session_id)
  where stripe_session_id is not null;

-- Public vehicle photos. Path: {company_id}/{vehicle_id}/{uuid}.jpg
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vehicle-photos',
  'vehicle-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "vehicle-photos public read" on storage.objects;
create policy "vehicle-photos public read"
  on storage.objects for select
  using (bucket_id = 'vehicle-photos');

drop policy if exists "vehicle-photos member insert" on storage.objects;
create policy "vehicle-photos member insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'vehicle-photos'
    and exists (
      select 1 from public.company_members cm
      where cm.user_id = auth.uid()
        and cm.company_id::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists "vehicle-photos member update" on storage.objects;
create policy "vehicle-photos member update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'vehicle-photos'
    and exists (
      select 1 from public.company_members cm
      where cm.user_id = auth.uid()
        and cm.company_id::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists "vehicle-photos member delete" on storage.objects;
create policy "vehicle-photos member delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'vehicle-photos'
    and exists (
      select 1 from public.company_members cm
      where cm.user_id = auth.uid()
        and cm.company_id::text = (storage.foldername(name))[1]
    )
  );
