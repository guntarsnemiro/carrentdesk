-- Germany + Benelux: add country codes DE/NL/BE/LU and 13 new city_slug values.
-- Run BEFORE loading the seed. Safe to re-run (IF NOT EXISTS).
--
-- Note: ALTER TYPE ... ADD VALUE must each be its own statement.

alter type public.country_code add value if not exists 'DE';
alter type public.country_code add value if not exists 'NL';
alter type public.country_code add value if not exists 'BE';
alter type public.country_code add value if not exists 'LU';

alter type public.city_slug add value if not exists 'berlin';
alter type public.city_slug add value if not exists 'munich';
alter type public.city_slug add value if not exists 'frankfurt';
alter type public.city_slug add value if not exists 'hamburg';
alter type public.city_slug add value if not exists 'cologne';
alter type public.city_slug add value if not exists 'dusseldorf';
alter type public.city_slug add value if not exists 'stuttgart';
alter type public.city_slug add value if not exists 'amsterdam';
alter type public.city_slug add value if not exists 'rotterdam';
alter type public.city_slug add value if not exists 'eindhoven';
alter type public.city_slug add value if not exists 'brussels';
alter type public.city_slug add value if not exists 'antwerp';
alter type public.city_slug add value if not exists 'luxembourg';
