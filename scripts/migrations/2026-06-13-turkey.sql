-- Turkey: add country code TR and 10 new city_slug values.
-- Run BEFORE loading the seed. Safe to re-run (IF NOT EXISTS).
--
-- Note: ALTER TYPE ... ADD VALUE must each be its own statement.

alter type public.country_code add value if not exists 'TR';

alter type public.city_slug add value if not exists 'antalya';
alter type public.city_slug add value if not exists 'alanya';
alter type public.city_slug add value if not exists 'bodrum';
alter type public.city_slug add value if not exists 'dalaman';
alter type public.city_slug add value if not exists 'izmir';
alter type public.city_slug add value if not exists 'istanbul';
alter type public.city_slug add value if not exists 'ankara';
alter type public.city_slug add value if not exists 'trabzon';
alter type public.city_slug add value if not exists 'adana';
alter type public.city_slug add value if not exists 'cappadocia';
