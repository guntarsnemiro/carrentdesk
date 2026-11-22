"use client";

import { useState } from "react";
import Image from "next/image";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";

const BUCKET = "vehicle-photos";
const MAX_PHOTOS = 8;
const MAX_BYTES = 5 * 1024 * 1024;

// Max dimensions and quality used when compressing before upload.
// Keeps file size ~100–200 KB while staying sharp on retina screens.
const COMPRESS_MAX_PX  = 1600;   // longest edge in pixels
const COMPRESS_QUALITY = 0.82;   // JPEG/WebP quality (0–1)

/**
 * Resizes and compresses an image file client-side using the Canvas API.
 * Returns a Blob (image/jpeg) ≤ ~200 KB. No libraries needed.
 */
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > COMPRESS_MAX_PX || height > COMPRESS_MAX_PX) {
        if (width >= height) {
          height = Math.round((height / width) * COMPRESS_MAX_PX);
          width  = COMPRESS_MAX_PX;
        } else {
          width  = Math.round((width / height) * COMPRESS_MAX_PX);
          height = COMPRESS_MAX_PX;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not available")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("Compression failed")),
        "image/jpeg",
        COMPRESS_QUALITY,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Could not read image")); };
    img.src = objectUrl;
  });
}

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

      // Compress + resize silently before upload — operator sees nothing different
      let blob: Blob;
      try {
        blob = await compressImage(file);
      } catch {
        // Fallback: upload original if canvas compression fails
        blob = file;
      }

      const path = `${companyId}/${vehicleId ?? "setup"}/${crypto.randomUUID()}.jpg`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, blob, {
        contentType: "image/jpeg",
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
            <div key={url} className="relative h-24 overflow-hidden rounded-lg border border-border bg-slate-50">
              <Image
                src={url}
                alt=""
                fill
                sizes="160px"
                className="object-cover"
              />
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
