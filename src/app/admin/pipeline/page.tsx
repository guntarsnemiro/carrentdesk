import type { Metadata } from "next";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  fetchPipelineStageCounts,
  fetchPriorityPipelineCompanies,
  PIPELINE_COMPANY_SELECT,
  type PipelineCompanyRow,
} from "@/lib/admin/pipeline-companies";
import { PipelineClient } from "./_components/pipeline-client";

export const metadata: Metadata = { title: "Pipeline" };

export default async function PipelinePage() {
  const db = createServiceRoleClient();
  const todayStr = new Date().toISOString().slice(0, 10);

  const [{ counts: stageCounts, total: totalCompanies }, priorityCompanies] = await Promise.all([
    fetchPipelineStageCounts(db),
    fetchPriorityPipelineCompanies(db),
  ]);

  const { data: overdueCompanies } = await db
    .from("companies")
    .select(PIPELINE_COMPANY_SELECT)
    .not("next_followup_at", "is", null)
    .lt("next_followup_at", todayStr)
    .order("next_followup_at")
    .limit(100);

  const { data: dueTodayCompanies } = await db
    .from("companies")
    .select(PIPELINE_COMPANY_SELECT)
    .eq("next_followup_at", todayStr)
    .order("name");

  const { data: cityRows } = await db
    .from("companies")
    .select("city")
    .or("status.eq.claimed,status.eq.verified,pipeline_stage.neq.unclaimed,next_followup_at.not.is.null")
    .limit(2000);

  const cityOptions = [...new Set((cityRows ?? []).map((r) => r.city))].sort();

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

  const pendingClaimsCount = (claimRequests ?? []).filter((r) => r.status === "pending").length;

  // Merge priority + follow-up rows so banner targets always appear in the table.
  const companyMap = new Map<string, PipelineCompanyRow>();
  for (const c of priorityCompanies) companyMap.set(c.id, c);
  for (const c of overdueCompanies ?? []) companyMap.set(c.id, c as PipelineCompanyRow);
  for (const c of dueTodayCompanies ?? []) companyMap.set(c.id, c as PipelineCompanyRow);
  for (const cr of claimRequests ?? []) {
    if (cr.status !== "pending") continue;
    const match = priorityCompanies.find((c) => c.id === cr.company_id);
    if (!match) {
      const { data: co } = await db
        .from("companies")
        .select(PIPELINE_COMPANY_SELECT)
        .eq("id", cr.company_id)
        .maybeSingle();
      if (co) companyMap.set(co.id, co as PipelineCompanyRow);
    }
  }

  return (
    <PipelineClient
      initialCompanies={[...companyMap.values()]}
      stageCounts={stageCounts}
      totalCompanies={totalCompanies}
      cityOptions={cityOptions}
      logsByCompany={logsByCompany}
      claimsByCompany={claimsByCompany}
      todayStr={todayStr}
      pendingClaimsCount={pendingClaimsCount}
    />
  );
}
