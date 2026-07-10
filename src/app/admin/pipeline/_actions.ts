"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { queryPipelineCompanies, type PipelineCompanyRow } from "@/lib/admin/pipeline-companies";
import { randomBytes } from "crypto";
import { sendClaimInvite } from "@/lib/email";

export async function searchPipelineCompanies(params: {
  search?: string;
  filterStage?: string;
  filterCity?: string;
}): Promise<PipelineCompanyRow[]> {
  const db = createServiceRoleClient();
  return queryPipelineCompanies(db, params);
}

export type PipelineStage = "unclaimed" | "contacted" | "interested" | "trial" | "active" | "not_interested";
export type OutreachChannel = "call" | "email" | "whatsapp" | "linkedin" | "other";
export type OutreachOutcome = "no_answer" | "left_message" | "spoke" | "interested" | "not_interested" | "callback_requested" | "other";

export async function updatePipelineStage(companyId: string, stage: PipelineStage) {
  const db = createServiceRoleClient();
  await db.from("companies").update({ pipeline_stage: stage }).eq("id", companyId);
  revalidatePath("/admin/pipeline");
}

export async function updateCompanyCrm(
  companyId: string,
  data: { contact_person?: string; next_followup_at?: string | null; outreach_notes?: string; fleet_size?: number | null }
) {
  const db = createServiceRoleClient();
  await db.from("companies").update(data).eq("id", companyId);
  revalidatePath("/admin/pipeline");
}

export async function logOutreach(data: {
  company_id: string;
  channel: OutreachChannel;
  outcome: OutreachOutcome;
  notes: string;
  contacted_at: string;
  next_followup_at?: string;
  pipeline_stage?: PipelineStage;
  contact_person?: string;
}) {
  const db = createServiceRoleClient();

  await db.from("outreach_logs").insert({
    company_id: data.company_id,
    channel: data.channel,
    outcome: data.outcome,
    notes: data.notes || null,
    contacted_at: data.contacted_at,
  });

  const hasUpdate = data.pipeline_stage || data.contact_person !== undefined || data.next_followup_at !== undefined;
  if (hasUpdate) {
    await db.from("companies").update({
      ...(data.pipeline_stage ? { pipeline_stage: data.pipeline_stage } : {}),
      ...(data.contact_person !== undefined ? { contact_person: data.contact_person } : {}),
      ...(data.next_followup_at !== undefined ? { next_followup_at: data.next_followup_at || null } : {}),
    }).eq("id", data.company_id);
  }

  revalidatePath("/admin/pipeline");
}

export async function approveClaimRequest(requestId: string, companyId: string, email: string, companyName: string) {
  const db = createServiceRoleClient();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await db.from("claim_tokens").insert({ company_id: companyId, token, sent_to_email: email, sent_at: new Date().toISOString(), expires_at: expiresAt });
  await db.from("claim_requests").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", requestId);
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://carrentdesk.com";
  try { await sendClaimInvite({ email, companyName, claimUrl: `${base}/claim?token=${token}` }); } catch (err) { console.error(err); }
  revalidatePath("/admin/pipeline");
}

export async function rejectClaimRequest(requestId: string) {
  const db = createServiceRoleClient();
  await db.from("claim_requests").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", requestId);
  revalidatePath("/admin/pipeline");
}
