-- Poland: add country code PL and 7 new city_slug values.
-- Run BEFORE loading the seed. Safe to re-run (IF NOT EXISTS).
--
-- Note: ALTER TYPE ... ADD VALUE must each be its own statement.

alter type public.country_code add value if not exists 'PL';

alter type public.city_slug add value if not exists 'warsaw';
alter type public.city_slug add value if not exists 'krakow';
alter type public.city_slug add value if not exists 'gdansk';
alter type public.city_slug add value if not exists 'gdynia';
alter type public.city_slug add value if not exists 'wroclaw';
alter type public.city_slug add value if not exists 'katowice';
alter type public.city_slug add value if not exists 'poznan';
