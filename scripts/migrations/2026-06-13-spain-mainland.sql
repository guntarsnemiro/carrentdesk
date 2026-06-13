-- Spain mainland coast: add 4 new city_slug values (Spain country already exists).
-- Run BEFORE loading the seed (after the Apify run). Safe to re-run (IF NOT EXISTS).
--
-- Note: ALTER TYPE ... ADD VALUE must each be its own statement; do NOT wrap in
-- a transaction that then references the new value.

alter type public.city_slug add value if not exists 'valencia';
alter type public.city_slug add value if not exists 'seville';
alter type public.city_slug add value if not exists 'bilbao';
alter type public.city_slug add value if not exists 'girona';
