-- Bulgaria: add Bulgaria country code + 4 new city_slug values.
-- Run BEFORE loading the seed (after the Apify run). Safe to re-run (IF NOT EXISTS).
--
-- Note: ALTER TYPE ... ADD VALUE must each be its own statement; do NOT wrap in
-- a transaction that then references the new value.

-- New country
alter type public.country_code add value if not exists 'BG';  -- Bulgaria

-- New city slugs
alter type public.city_slug add value if not exists 'sofia';
alter type public.city_slug add value if not exists 'varna';
alter type public.city_slug add value if not exists 'burgas';
alter type public.city_slug add value if not exists 'plovdiv';
