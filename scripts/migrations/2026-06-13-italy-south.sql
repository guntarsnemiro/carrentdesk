-- Italy south + Tuscany + Veneto: add 5 new city_slug values (Italy exists).
-- Run BEFORE loading the seed (after the Apify run). Safe to re-run (IF NOT EXISTS).
--
-- Note: ALTER TYPE ... ADD VALUE must each be its own statement; do NOT wrap in
-- a transaction that then references the new value.

alter type public.city_slug add value if not exists 'venice';
alter type public.city_slug add value if not exists 'florence';
alter type public.city_slug add value if not exists 'pisa';
alter type public.city_slug add value if not exists 'bari';
alter type public.city_slug add value if not exists 'brindisi';
