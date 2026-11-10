"use client";

import { useState } from "react";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";

const BUCKET = "vehicle-photos";
const MAX_PHOTOS = 8;
const MAX_BYTES = 5 * 1024 * 1024;

type Props = {
  companyId: string;
  vehicleId?: string;
  /** Upload before the car row exists. Files go in the company folder. */
  allowDraft?: boolean;
  urls: string[];
  onChange: (urls: string[]) => void;
};

export function VehiclePhotos({ companyId, vehicleId, urls, onChange, allowDraft = false }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    if (!vehicleId && !allowDraft) {
      setError("Save the car first, then add photos.");
      return;
    }
    setBusy(true);
    setError("");
    const supabase = getAuthBrowserClient();
    const next = [...urls];

    for (const file of Array.from(files)) {
      if (next.length >= MAX_PHOTOS) break;
      if (!file.type.startsWith("image/")) {
        setError("Only JPG, PNG, or WebP images.");
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError("Each photo must be under 5 MB.");
        continue;
      }
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${companyId}/${vehicleId ?? "setup"}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (upErr) {
        setError(upErr.message);
        continue;
      }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      next.push(data.publicUrl);
    }

    onChange(next);
    setBusy(false);
  }

  async function removeAt(index: number) {
    const url = urls[index];
    const next = urls.filter((_, i) => i !== index);
    onChange(next);
    if (!vehicleId) return;
    const marker = `/${BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return;
    const path = decodeURIComponent(url.slice(idx + marker.length));
    await getAuthBrowserClient().storage.from(BUCKET).remove([path]);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-neutral-400">
        Customers see these photos — not the plate. Up to {MAX_PHOTOS} photos.
      </p>
      {urls.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {urls.map((url, i) => (
            <div key={url} className="relative overflow-hidden rounded-lg border border-border bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-24 w-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
      {urls.length < MAX_PHOTOS && (
        <label className="inline-flex cursor-pointer items-center rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-slate-50">
          {busy ? "Uploading…" : "Add photos"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            disabled={busy || (!vehicleId && !allowDraft)}
            onChange={(e) => {
              void uploadFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      )}
      {!vehicleId && !allowDraft && (
        <p className="text-xs text-neutral-500">Save the car, then open it again to add photos.</p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
