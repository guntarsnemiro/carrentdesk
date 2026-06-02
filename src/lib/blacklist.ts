import "server-only";
import crypto from "crypto";
import { createServiceRoleClient } from "@/lib/supabase/server";

export { REASON_LABELS, SEVERITY_LABELS } from "@/lib/blacklist-shared";

/* ── Hashing ─────────────────────────────────────────────────────── */

/** Normalize and SHA-256 hash a document number. */
export function hashDoc(raw: string): string {
  return crypto
    .createHash("sha256")
    .update(raw.trim().toUpperCase())
    .digest("hex");
}

/**
 * Hash full name + date of birth for soft matching.
 * Normalizes unicode (NFD → remove combining marks → uppercase → collapse spaces).
 * Format: "FIRSTNAME LASTNAME YYYY-MM-DD"
 */
export function hashNameDob(fullName: string, dob: string): string {
  const name = fullName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
  const key = `${name} ${dob.trim()}`;
  return crypto.createHash("sha256").update(key).digest("hex");
}

/* ── Types ───────────────────────────────────────────────────────── */

export type MatchStrength = "strong" | "soft";

export interface GlobalMatch {
  id: string;
  reason_category: string;
  severity: number;
  country: string | null;
  notes_public: string | null;
  submitted_at: string;
  strength: MatchStrength;
  matched_on: string; // human-readable: "Passport", "Driver's license", etc.
}

export interface CustomerHashes {
  idHash?:        string;
  licenseHash?:   string;
  passportHash?:  string;
  nameDobHash?:   string;
}

/** Build all available hashes from raw customer fields. */
export function buildCustomerHashes(opts: {
  idNumber?:       string | null;
  licenseNumber?:  string | null;
  passportNumber?: string | null;
  fullName?:       string | null;
  dateOfBirth?:    string | null;
}): CustomerHashes {
  const h: CustomerHashes = {};
  if (opts.idNumber?.trim())       h.idHash       = hashDoc(opts.idNumber);
  if (opts.licenseNumber?.trim())  h.licenseHash  = hashDoc(opts.licenseNumber);
  if (opts.passportNumber?.trim()) h.passportHash = hashDoc(opts.passportNumber);
  if (opts.fullName?.trim() && opts.dateOfBirth?.trim()) {
    h.nameDobHash = hashNameDob(opts.fullName, opts.dateOfBirth);
  }
  return h;
}

/* ── Query ───────────────────────────────────────────────────────── */

/**
 * Returns all approved global blacklist entries that match any of the
 * provided hashes, tagged with match strength.
 *
 * Strong  = document number match (near-certain same person)
 * Soft    = name+DOB match only  (likely — verify manually)
 */
export async function checkGlobalBlacklist(opts: {
  idNumber?:       string | null;
  licenseNumber?:  string | null;
  passportNumber?: string | null;
  fullName?:       string | null;
  dateOfBirth?:    string | null;
}): Promise<GlobalMatch[]> {
  const h = buildCustomerHashes(opts);
  if (Object.keys(h).length === 0) return [];

  const db = createServiceRoleClient();

  // Build OR filter covering all available hashes
  const orParts: string[] = [];
  if (h.idHash)       orParts.push(`id_hash.eq.${h.idHash}`);
  if (h.licenseHash)  orParts.push(`license_hash.eq.${h.licenseHash}`);
  if (h.passportHash) orParts.push(`passport_hash.eq.${h.passportHash}`);
  if (h.nameDobHash)  orParts.push(`name_dob_hash.eq.${h.nameDobHash}`);

  const { data } = await db
    .from("global_blacklist")
    .select("id, reason_category, severity, country, notes_public, submitted_at, id_hash, license_hash, passport_hash, name_dob_hash")
    .eq("status", "approved")
    .or(orParts.join(","))
    .order("severity", { ascending: false });

  if (!data) return [];

  return data.map((row) => {
    // Determine strength and what matched
    const docMatch =
      (h.idHash       && row.id_hash       === h.idHash)       ? "ID / National ID" :
      (h.licenseHash  && row.license_hash  === h.licenseHash)  ? "Driver's license" :
      (h.passportHash && row.passport_hash === h.passportHash) ? "Passport" :
      null;

    const softMatch = h.nameDobHash && row.name_dob_hash === h.nameDobHash;

    return {
      id:               row.id,
      reason_category:  row.reason_category,
      severity:         row.severity,
      country:          row.country,
      notes_public:     row.notes_public,
      submitted_at:     row.submitted_at,
      strength:         docMatch ? "strong" : "soft",
      matched_on:       docMatch ?? "Name + date of birth",
    } satisfies GlobalMatch;
  });
}
