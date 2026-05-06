export type VehicleType =
  | "economy"
  | "mid_size"
  | "suv"
  | "van"
  | "nine_seater"
  | "electric";

export type VehicleTypeMeta = {
  key: VehicleType;
  label: string;
  short: string;
  /** Inline SVG path data sized for a 24x24 viewBox. Stroke-only, no fill. */
  iconPath: string;
};

export const VEHICLE_TYPES: VehicleTypeMeta[] = [
  {
    key: "economy",
    label: "Economy",
    short: "Compact, fuel-efficient cars",
    iconPath:
      "M3 14h18l-1.5-4.5a2 2 0 0 0-1.9-1.5H6.4a2 2 0 0 0-1.9 1.5L3 14zM5 14v3M19 14v3M7 17h2M15 17h2",
  },
  {
    key: "mid_size",
    label: "Mid-size",
    short: "Comfortable sedans & wagons",
    iconPath:
      "M2 14h20l-2-5a2 2 0 0 0-1.9-1.4H5.9A2 2 0 0 0 4 9l-2 5zM4 14v3M20 14v3M6 17h2M16 17h2",
  },
  {
    key: "suv",
    label: "SUV",
    short: "Higher ground clearance",
    iconPath:
      "M2 13h20l-2.5-6a2 2 0 0 0-1.85-1.25H6.35A2 2 0 0 0 4.5 7L2 13zM4 13v4M20 13v4M6 17h2M16 17h2",
  },
  {
    key: "van",
    label: "Van",
    short: "Cargo & utility vans",
    iconPath:
      "M2 6h13l5 4v6H2V6zM4 16v2M18 16v2M5 18h2M16 18h2M9 9h6",
  },
  {
    key: "nine_seater",
    label: "9-seater",
    short: "Groups & families",
    iconPath:
      "M2 7h16l3 4v6H2V7zM4 17v2M19 17v2M5 19h2M17 19h2M5 10h12M5 13h12",
  },
  {
    key: "electric",
    label: "Electric",
    short: "EV & hybrid options",
    iconPath:
      "M3 14h16l-1.5-4.5a2 2 0 0 0-1.9-1.5H6.4a2 2 0 0 0-1.9 1.5L3 14zM5 14v3M17 14v3M19 9l3-3M21 6h-3v3",
  },
];

export function getVehicleType(key: string): VehicleTypeMeta | undefined {
  return VEHICLE_TYPES.find((v) => v.key === key);
}
