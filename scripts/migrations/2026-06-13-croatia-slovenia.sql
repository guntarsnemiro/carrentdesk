-- Croatia boost + Slovenia: add Slovenia country code + 4 new city_slug values.
-- Run BEFORE loading the seed (after the Apify run). Safe to re-run (IF NOT EXISTS).
--
-- Note: ALTER TYPE ... ADD VALUE must each be its own statement; do NOT wrap in
-- a transaction that then references the new value.

-- New country
alter type public.country_code add value if not exists 'SI';  -- Slovenia

-- New city slugs — Croatia (Istria + Kvarner)
alter type public.city_slug add value if not exists 'pula';
alter type public.city_slug add value if not exists 'rijeka';

-- Slovenia
alter type public.city_slug add value if not exists 'ljubljana';
alter type public.city_slug add value if not exists 'koper';
