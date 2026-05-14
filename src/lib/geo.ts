/**
 * Small geo utilities used by the marketplace UI.
 *
 * We deliberately avoid pulling a full geospatial library — the only
 * distances we currently care about are short (a single city), so the
 * spherical-Earth Haversine formula is well within the precision we need
 * (sub-100m error at the 10km scale we operate at).
 */

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Great-circle distance between two `[lat, lng]` points, in kilometres.
 * Returns a positive float; rounding / formatting is up to the caller.
 */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Formats a kilometre distance for compact, scannable UI:
 *   < 10 km -> one decimal ("4.2 km")
 *   >= 10 km -> rounded integer ("12 km")
 */
export function formatKm(km: number): string {
  if (!Number.isFinite(km) || km < 0) return "";
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
