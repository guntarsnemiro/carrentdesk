import type { Metadata } from "next";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { PipelineClient } from "./_components/pipeline-client";

export const metadata: Metadata = { title: "Pipeline" };

export default async function PipelinePage() {
  const db = createServiceRoleClient();

  const { data: companies } = await db
    .from("companies")
    .select(`
      id, name, slug, city, country, phone, website, whatsapp,
      pipeline_stage, contact_person, next_followup_at, outreach_notes,
      fleet_size, status, claimed_at
    `)
    .order("next_followup_at", { ascending: true, nullsFirst: false })
    .order("name");

  const { data: logs } = await db
    .from("outreach_logs")
    .select("id, company_id, channel, outcome, notes, contacted_at")
    .order("contacted_at", { ascending: false });

  const { data: claimRequests } = await db
    .from("claim_requests")
    .select("id, company_id, email, name, message, status, created_at")
    .order("created_at", { ascending: false });

  type LogRow = { id: string; company_id: string; channel: string; outcome: string; notes: string | null; contacted_at: string };
  type ClaimRow = { id: string; company_id: string; email: string; name: string | null; message: string | null; status: string; created_at: string };

  const logsByCompany: Record<string, LogRow[]> = {};
  for (const log of logs ?? []) {
    if (!logsByCompany[log.company_id]) logsByCompany[log.company_id] = [];
    logsByCompany[log.company_id]!.push(log);
  }

  const claimsByCompany: Record<string, ClaimRow[]> = {};
  for (const cr of claimRequests ?? []) {
    if (!claimsByCompany[cr.company_id]) claimsByCompany[cr.company_id] = [];
    claimsByCompany[cr.company_id]!.push(cr);
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const pendingClaimsCount = (claimRequests ?? []).filter((r) => r.status === "pending").length;

  return (
    <PipelineClient
      companies={companies ?? []}
      logsByCompany={logsByCompany}
      claimsByCompany={claimsByCompany}
      todayStr={todayStr}
      pendingClaimsCount={pendingClaimsCount}
    />
  );
}
