-- UK + Ireland: add country codes GB/IE and 16 new city_slug values.
-- Run BEFORE loading the seed. Safe to re-run (IF NOT EXISTS).
--
-- Note: ALTER TYPE ... ADD VALUE must each be its own statement.

alter type public.country_code add value if not exists 'GB';
alter type public.country_code add value if not exists 'IE';

alter type public.city_slug add value if not exists 'london';
alter type public.city_slug add value if not exists 'manchester';
alter type public.city_slug add value if not exists 'birmingham';
alter type public.city_slug add value if not exists 'edinburgh';
alter type public.city_slug add value if not exists 'glasgow';
alter type public.city_slug add value if not exists 'bristol';
alter type public.city_slug add value if not exists 'liverpool';
alter type public.city_slug add value if not exists 'leeds';
alter type public.city_slug add value if not exists 'newcastle';
alter type public.city_slug add value if not exists 'cardiff';
alter type public.city_slug add value if not exists 'aberdeen';
alter type public.city_slug add value if not exists 'belfast';
alter type public.city_slug add value if not exists 'dublin';
alter type public.city_slug add value if not exists 'cork';
alter type public.city_slug add value if not exists 'shannon';
alter type public.city_slug add value if not exists 'galway';
