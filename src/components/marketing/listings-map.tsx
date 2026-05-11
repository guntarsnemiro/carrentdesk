"use client";

/**
 * Leaflet map view of all listings in the current filter.
 *
 * Loaded via `dynamic(..., { ssr: false })` from city-listings-view because
 * Leaflet touches `window` at import time. We use OpenStreetMap tiles (no API
 * key needed) and custom HTML pins so the styling matches the brand.
 *
 * Pins are color-coded: verified design partners get the brand-blue marker
 * with a "✓"; everyone else gets a neutral slate marker. Click any pin → mini
 * popup with the operator's name, fleet snippet, phone, and a deep link to
 * their profile.
 */

import { useEffect, useMemo } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Listing } from "@/lib/listings-types";

type Props = {
  listings: Listing[];
  /** Used as the initial center if no listings have coordinates. */
  fallbackCenter: [number, number];
};

const VERIFIED_PIN_HTML = `
  <span class="crd-pin crd-pin--verified" aria-hidden="true">
    <span class="crd-pin__dot"></span>
  </span>
`;

const DEFAULT_PIN_HTML = `
  <span class="crd-pin crd-pin--default" aria-hidden="true">
    <span class="crd-pin__dot"></span>
  </span>
`;

function makeIcon(html: string): L.DivIcon {
  return L.divIcon({
    className: "crd-pin-wrapper",
    html,
    iconSize: [28, 36],
    iconAnchor: [14, 34],
    popupAnchor: [0, -30],
  });
}

export default function ListingsMap({ listings, fallbackCenter }: Props) {
  const verifiedIcon = useMemo(() => makeIcon(VERIFIED_PIN_HTML), []);
  const defaultIcon = useMemo(() => makeIcon(DEFAULT_PIN_HTML), []);

  const pinned = useMemo(
    () => listings.filter((l) => !!l.coordinates),
    [listings],
  );

  // Pick an initial center: midpoint of pinned listings if any, else city center.
  const initialCenter: [number, number] = useMemo(() => {
    if (pinned.length === 0) return fallbackCenter;
    const lats = pinned.map((l) => l.coordinates!.lat);
    const lngs = pinned.map((l) => l.coordinates!.lng);
    const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
    return [avgLat, avgLng];
  }, [pinned, fallbackCenter]);

  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-border">
      <MapContainer
        center={initialCenter}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: 560, width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png"
        />
        <FitBoundsToListings listings={pinned} />
        {pinned.map((l) => (
          <Marker
            key={l.id}
            position={[l.coordinates!.lat, l.coordinates!.lng]}
            icon={l.status === "verified" ? verifiedIcon : defaultIcon}
          >
            <Popup>
              <div className="crd-popup">
                <div className="crd-popup__name">{l.name}</div>
                {l.address && (
                  <div className="crd-popup__address">{l.address}</div>
                )}
                {l.fleet.description && (
                  <p className="crd-popup__desc">{l.fleet.description}</p>
                )}
                <div className="crd-popup__row">
                  {l.phone && (
                    <a href={`tel:${l.phone}`} className="crd-popup__phone">
                      {l.phone}
                    </a>
                  )}
                  <a href={`/c/${l.slug}`} className="crd-popup__view">
                    View profile →
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

/**
 * Auto-fits the map viewport to contain every pinned listing. Runs once on
 * mount and again whenever the set of pinned listings changes (e.g. a filter).
 */
function FitBoundsToListings({ listings }: { listings: Listing[] }) {
  const map = useMap();
  useEffect(() => {
    if (listings.length === 0) return;
    if (listings.length === 1) {
      const { lat, lng } = listings[0].coordinates!;
      map.setView([lat, lng], 14);
      return;
    }
    const bounds = L.latLngBounds(
      listings.map((l) => [l.coordinates!.lat, l.coordinates!.lng]),
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [listings, map]);
  return null;
}
