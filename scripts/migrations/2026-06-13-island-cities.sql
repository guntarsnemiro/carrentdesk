-- Island expansion: add new country codes + city_slug enum values.
-- Run this BEFORE loading the island scrape (seed) — but AFTER the Apify run.
-- Safe to run multiple times (IF NOT EXISTS guards).
--
-- Note: ALTER TYPE ... ADD VALUE must each be its own statement and cannot be
-- used in the same transaction that then references the new value, so do NOT
-- wrap these in begin/commit.

-- New countries
alter type public.country_code add value if not exists 'CY';  -- Cyprus
alter type public.country_code add value if not exists 'MT';  -- Malta

-- New city slugs — Spain (Canaries + Balearics)
alter type public.city_slug add value if not exists 'tenerife';
alter type public.city_slug add value if not exists 'gran-canaria';
alter type public.city_slug add value if not exists 'lanzarote';
alter type public.city_slug add value if not exists 'fuerteventura';
alter type public.city_slug add value if not exists 'ibiza';
alter type public.city_slug add value if not exists 'menorca';
alter type public.city_slug add value if not exists 'la-palma';
alter type public.city_slug add value if not exists 'la-gomera';
alter type public.city_slug add value if not exists 'el-hierro';

-- Portugal (Madeira)
alter type public.city_slug add value if not exists 'funchal';

-- Italy (Sardinia + Sicily)
alter type public.city_slug add value if not exists 'olbia';
alter type public.city_slug add value if not exists 'cagliari';
alter type public.city_slug add value if not exists 'palermo';

-- Greece (islands)
alter type public.city_slug add value if not exists 'corfu';
alter type public.city_slug add value if not exists 'santorini';
alter type public.city_slug add value if not exists 'mykonos';
alter type public.city_slug add value if not exists 'kos';
alter type public.city_slug add value if not exists 'zakynthos';
alter type public.city_slug add value if not exists 'chania';

-- Cyprus
alter type public.city_slug add value if not exists 'larnaca';
alter type public.city_slug add value if not exists 'paphos';

-- Malta
alter type public.city_slug add value if not exists 'malta';
