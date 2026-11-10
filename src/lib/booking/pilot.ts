/** Live-booking pilot. Other cities stay listings + inquiry. */
export const PILOT_CITY_SLUG = "riga";
export const PILOT_COMPANY_SLUG = "baltic-car-rent";
export const PILOT_COMPANY_SLUGS = [PILOT_COMPANY_SLUG] as const;

export function isPilotCity(slug: string): boolean {
  return slug === PILOT_CITY_SLUG;
}

export function isPilotCompany(slug: string): boolean {
  return (PILOT_COMPANY_SLUGS as readonly string[]).includes(slug);
}
