-- France expansion: add France country code + 7 new city_slug values.
-- Run BEFORE loading the seed (after the Apify run). Safe to re-run (IF NOT EXISTS).
--
-- Note: ALTER TYPE ... ADD VALUE must each be its own statement; do NOT wrap in
-- a transaction that then references the new value.

-- New country
alter type public.country_code add value if not exists 'FR';  -- France

-- New city slugs — France (Corsica + Cote d'Azur + majors)
alter type public.city_slug add value if not exists 'nice';
alter type public.city_slug add value if not exists 'ajaccio';
alter type public.city_slug add value if not exists 'bastia';
alter type public.city_slug add value if not exists 'marseille';
alter type public.city_slug add value if not exists 'bordeaux';
alter type public.city_slug add value if not exists 'paris';
alter type public.city_slug add value if not exists 'lyon';
