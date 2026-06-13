-- Montenegro + Albania: add 2 country codes + 9 new city_slug values.
-- Run BEFORE loading the seed (after the Apify run). Safe to re-run (IF NOT EXISTS).
--
-- Note: ALTER TYPE ... ADD VALUE must each be its own statement; do NOT wrap in
-- a transaction that then references the new value.

-- New countries
alter type public.country_code add value if not exists 'ME';  -- Montenegro
alter type public.country_code add value if not exists 'AL';  -- Albania

-- Montenegro
alter type public.city_slug add value if not exists 'tivat';
alter type public.city_slug add value if not exists 'budva';
alter type public.city_slug add value if not exists 'kotor';
alter type public.city_slug add value if not exists 'bar';
alter type public.city_slug add value if not exists 'podgorica';

-- Albania
alter type public.city_slug add value if not exists 'tirana';
alter type public.city_slug add value if not exists 'saranda';
alter type public.city_slug add value if not exists 'vlore';
alter type public.city_slug add value if not exists 'durres';
