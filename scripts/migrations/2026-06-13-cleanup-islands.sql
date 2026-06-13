-- Cleanup pass: Azores (PT) + more Greek islands (GR). Countries already exist.
-- Adds 4 new city_slug values. Run BEFORE loading the seed. Safe to re-run.
--
-- Note: ALTER TYPE ... ADD VALUE must each be its own statement.

alter type public.city_slug add value if not exists 'ponta-delgada';
alter type public.city_slug add value if not exists 'kefalonia';
alter type public.city_slug add value if not exists 'naxos';
alter type public.city_slug add value if not exists 'paros';
