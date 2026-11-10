"use client";

import { useEffect, useState } from "react";
import type { AddressHit } from "@/lib/booking/address";

type Props = {
  citySlug: string;
  cityName: string;
  label: string;
  /** Search outside the company's city. */
  anywhere?: boolean;
  initial?: AddressHit | null;
  onSelect: (hit: AddressHit | null) => void;
};

export function AddressSearch({ citySlug, cityName, label, onSelect, initial = null, anywhere = false }: Props) {
  const [query, setQuery] = useState(initial?.label ?? "");
  const [results, setResults] = useState<AddressHit[]>([]);
  const [selected, setSelected] = useState<AddressHit | null>(initial);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (selected && query === selected.label) return;
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setStatus("idle");
      return;
    }
    const handle = window.setTimeout(async () => {
      setStatus("loading");
      try {
        const scope = anywhere ? "&anywhere=1" : "";
        const response = await fetch(`/api/address-search?city=${encodeURIComponent(citySlug)}&q=${encodeURIComponent(trimmed)}${scope}`);
        const data = await response.json() as { results?: AddressHit[]; error?: string };
        setResults(data.results ?? []);
        setStatus(data.error ? "error" : "idle");
      } catch {
        setResults([]);
        setStatus("error");
      }
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query, citySlug, selected, anywhere]);

  return (
    <div>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</span>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selected) {
              setSelected(null);
              onSelect(null);
            }
          }}
          placeholder={anywhere ? "Street or hotel, in any city" : `Hotel or street in ${cityName}`}
          className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-brand-950 outline-none focus:ring-2 focus:ring-brand-200"
          autoComplete="off"
        />
      </label>
      {status === "loading" && <p className="mt-1 text-xs text-neutral-500">Searching addresses…</p>}
      {results.length > 0 && !selected && (
        <ul className="mt-1 overflow-hidden rounded-lg border border-border bg-white">
          {results.map((hit) => (
            <li key={`${hit.label}-${hit.lat}`}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm text-brand-950 hover:bg-surface-soft"
                onClick={() => {
                  setSelected(hit);
                  setQuery(hit.label);
                  setResults([]);
                  onSelect(hit);
                }}
              >
                {hit.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {selected && <p className="mt-1 text-xs text-neutral-500">Selected from the address list.</p>}
      {status === "error" && <p className="mt-1 text-xs text-amber-800">Address search is unavailable. Try again.</p>}
    </div>
  );
}
