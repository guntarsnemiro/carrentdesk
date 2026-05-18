"use client";

import { useEffect, useRef } from "react";

interface Props {
  lat: number;
  lng: number;
  label?: string;
}

/**
 * Tiny Leaflet map for the company profile sidebar.
 * Renders a marker at the exact listing coordinates.
 */
export function LocationMap({ lat, lng, label }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let map: ReturnType<typeof import("leaflet")["map"]>;

    import("leaflet").then((L) => {
      // Fix default marker icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        iconUrl: "/leaflet/marker-icon.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      });

      map = L.map(containerRef.current!, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([lat, lng]).addTo(map);
      if (label) marker.bindPopup(label);

      mapRef.current = map;
    });

    return () => {
      if (map) map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div
        ref={containerRef}
        className="mt-4 h-48 w-full overflow-hidden rounded-lg ring-1 ring-border"
      />
    </>
  );
}
