-- Switzerland + Austria: add country codes CH/AT and 10 new city_slug values.
-- Run BEFORE loading the seed. Safe to re-run (IF NOT EXISTS).
--
-- Note: ALTER TYPE ... ADD VALUE must each be its own statement.

alter type public.country_code add value if not exists 'CH';
alter type public.country_code add value if not exists 'AT';

alter type public.city_slug add value if not exists 'zurich';
alter type public.city_slug add value if not exists 'geneva';
alter type public.city_slug add value if not exists 'basel';
alter type public.city_slug add value if not exists 'bern';
alter type public.city_slug add value if not exists 'lugano';
alter type public.city_slug add value if not exists 'vienna';
alter type public.city_slug add value if not exists 'salzburg';
alter type public.city_slug add value if not exists 'innsbruck';
alter type public.city_slug add value if not exists 'graz';
alter type public.city_slug add value if not exists 'klagenfurt';
