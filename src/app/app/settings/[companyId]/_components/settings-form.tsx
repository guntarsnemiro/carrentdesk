"use client";

import { useState, useEffect } from "react";

function storageKey(companyId: string) {
  return `crd-settings-${companyId}`;
}

interface Settings {
  timeFormat: "12h" | "24h";
}

function loadSettings(companyId: string): Settings {
  if (typeof window === "undefined") return { timeFormat: "24h" };
  try {
    const raw = localStorage.getItem(storageKey(companyId));
    if (!raw) return { timeFormat: "24h" };
    return { timeFormat: "24h", ...JSON.parse(raw) };
  } catch {
    return { timeFormat: "24h" };
  }
}

function saveSettings(companyId: string, s: Settings) {
  localStorage.setItem(storageKey(companyId), JSON.stringify(s));
}

export function SettingsForm({ companyId }: { companyId: string }) {
  const [settings, setSettings] = useState<Settings>({ timeFormat: "24h" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(loadSettings(companyId));
  }, [companyId]);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    saveSettings(companyId, settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Time format */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-1 text-base font-semibold text-neutral-900">Time format</h2>
        <p className="mb-5 text-sm text-neutral-500">
          Controls how times are displayed in booking forms and the calendar.
        </p>
        <div className="flex gap-3">
          {(["24h", "12h"] as const).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => update("timeFormat", fmt)}
              className={`flex-1 rounded-xl border py-3 text-sm font-semibold transition-colors ${
                settings.timeFormat === fmt
                  ? "border-brand-700 bg-brand-50 text-brand-700"
                  : "border-border text-neutral-500 hover:bg-slate-50"
              }`}
            >
              {fmt === "24h" ? "24-hour (13:00)" : "12-hour (1:00 PM)"}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-neutral-400">
          Default: 24-hour format. Settings are saved per browser.
        </p>
      </div>

      {/* Date format note */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-1 text-base font-semibold text-neutral-900">Date format</h2>
        <p className="text-sm text-neutral-500">
          All dates are displayed as <strong>DD/MM/YYYY</strong> throughout the platform.
          Type dates in DD/MM/YYYY format in any date field — dots (DD.MM.YYYY) are also accepted.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
        >
          {saved ? "Saved ✓" : "Save settings"}
        </button>
      </div>
    </div>
  );
}
