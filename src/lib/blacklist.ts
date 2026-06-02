import "server-only";
import crypto from "crypto";
import { createServiceRoleClient } from "@/lib/supabase/server";

export { REASON_LABELS, SEVERITY_LABELS } from "@/lib/blacklist-shared";

/** Normalize and hash a document number for privacy-preserving comparison. */
export function hashDoc(raw: string): string {
  return crypto
    .createHash("sha256")
    .update(raw.trim().toUpperCase())
    .digest("hex");
}

export interface GlobalMatch {
  id: string;
  reason_category: string;
  severity: number;
  country: string | null;
  notes_public: string | null;
  submitted_at: string;
}

/**
 * Returns all approved global blacklist entries that match any of the
 * provided document numbers. Empty array if none match or none provided.
 */
export async function checkGlobalBlacklist(
  idNumber: string | null | undefined,
  licenseNumber: string | null | undefined
): Promise<GlobalMatch[]> {
  if (!idNumber && !licenseNumber) return [];

  const db = createServiceRoleClient();

  const hashes: string[] = [];
  if (idNumber)      hashes.push(hashDoc(idNumber));
  if (licenseNumber) hashes.push(hashDoc(licenseNumber));

  const { data } = await db
    .from("global_blacklist")
    .select("id, reason_category, severity, country, notes_public, submitted_at")
    .eq("status", "approved")
    .or(
      [
        idNumber      ? `id_hash.eq.${hashDoc(idNumber)}`           : null,
        licenseNumber ? `license_hash.eq.${hashDoc(licenseNumber)}` : null,
      ]
        .filter(Boolean)
        .join(",")
    )
    .order("severity", { ascending: false });

  return (data ?? []) as GlobalMatch[];
}
