"use server";

import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { buildCustomerHashes } from "@/lib/blacklist";
import { revalidatePath } from "next/cache";

export interface SubmitBlacklistReportInput {
  companyId:      string;
  customerId:     string;
  /* raw document values — hashed server-side, never stored as-is */
  idNumber:       string | null;
  licenseNumber:  string | null;
  passportNumber: string | null;
  fullName:       string | null;
  dateOfBirth:    string | null;
  /* public-facing fields */
  reasonCategory: string;
  severity:       number;
  country:        string;
  notesPublic:    string;
}

export async function submitGlobalBlacklistReport(
  input: SubmitBlacklistReportInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const hashes = buildCustomerHashes({
    idNumber:       input.idNumber,
    licenseNumber:  input.licenseNumber,
    passportNumber: input.passportNumber,
    fullName:       input.fullName,
    dateOfBirth:    input.dateOfBirth,
  });

  if (Object.keys(hashes).length === 0) {
    return { ok: false, error: "No identifiable information found. Add at least one document number or a name + date of birth to this customer before reporting." };
  }

  const db = createServiceRoleClient();

  // Verify membership
  const { data: membership } = await db
    .from("company_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("company_id", input.companyId)
    .maybeSingle();
  if (!membership) return { ok: false, error: "Not authorized" };

  const { error } = await db.from("global_blacklist").insert({
    submitted_by_company_id: input.companyId,
    local_customer_id:       input.customerId,
    id_hash:                 hashes.idHash       ?? null,
    license_hash:            hashes.licenseHash  ?? null,
    passport_hash:           hashes.passportHash ?? null,
    name_dob_hash:           hashes.nameDobHash  ?? null,
    reason_category:         input.reasonCategory,
    severity:                input.severity,
    country:                 input.country || null,
    notes_public:            input.notesPublic.trim() || null,
    status:                  "pending",
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/app/customers/${input.companyId}/${input.customerId}`);
  return { ok: true };
}

export async function approveGlobalReport(reportId: string): Promise<{ ok: boolean; error?: string }> {
  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const db = createServiceRoleClient();
  const { error } = await db
    .from("global_blacklist")
    .update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by_user_id: user.id })
    .eq("id", reportId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/blacklist");
  return { ok: true };
}

export async function rejectGlobalReport(reportId: string, reason: string): Promise<{ ok: boolean; error?: string }> {
  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const db = createServiceRoleClient();
  const { error } = await db
    .from("global_blacklist")
    .update({ status: "rejected", reviewed_at: new Date().toISOString(), reviewed_by_user_id: user.id, reject_reason: reason })
    .eq("id", reportId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/blacklist");
  return { ok: true };
}
