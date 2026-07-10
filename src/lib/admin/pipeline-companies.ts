import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export const PIPELINE_COMPANY_SELECT =
  "id, name, slug, city, country, phone, website, whatsapp, pipeline_stage, contact_person, next_followup_at, outreach_notes, fleet_size, status, claimed_at";

export type PipelineCompanyRow = {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  phone: string | null;
  website: string | null;
  whatsapp: string | null;
  pipeline_stage: string;
  contact_person: string | null;
  next_followup_at: string | null;
  outreach_notes: string | null;
  fleet_size: number | null;
  status: string;
  claimed_at: string | null;
};

type Db = SupabaseClient<Database>;

const STAGES = ["unclaimed", "contacted", "interested", "trial", "active", "not_interested"] as const;

/** Supabase PostgREST returns at most 1000 rows per request — page through the rest. */
export async function fetchAllCompaniesPaginated(db: Db): Promise<PipelineCompanyRow[]> {
  const pageSize = 1000;
  const all: PipelineCompanyRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await db
      .from("companies")
      .select(PIPELINE_COMPANY_SELECT)
      .order("next_followup_at", { ascending: true, nullsFirst: false })
      .order("name")
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data?.length) break;
    all.push(...(data as PipelineCompanyRow[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return all;
}

export async function fetchPipelineStageCounts(db: Db) {
  const counts: Record<string, number> = {};
  let total = 0;

  for (const stage of STAGES) {
    const { count, error } = await db
      .from("companies")
      .select("*", { count: "exact", head: true })
      .eq("pipeline_stage", stage);
    if (error) throw error;
    counts[stage] = count ?? 0;
    total += counts[stage]!;
  }

  return { counts, total };
}

/** CRM-relevant rows shown before the user searches the full catalog. */
export async function fetchPriorityPipelineCompanies(db: Db) {
  const { data, error } = await db
    .from("companies")
    .select(PIPELINE_COMPANY_SELECT)
    .or("status.eq.claimed,status.eq.verified,pipeline_stage.neq.unclaimed,next_followup_at.not.is.null")
    .order("next_followup_at", { ascending: true, nullsFirst: false })
    .order("name")
    .limit(500);

  if (error) throw error;
  return (data ?? []) as PipelineCompanyRow[];
}

export async function queryPipelineCompanies(
  db: Db,
  params: {
    search?: string;
    filterStage?: string;
    filterCity?: string;
  }
): Promise<PipelineCompanyRow[]> {
  const q = params.search?.trim();
  const hasSearch = Boolean(q && q.length >= 2);
  const hasStageFilter = Boolean(params.filterStage && params.filterStage !== "all");
  const hasCityFilter = Boolean(params.filterCity && params.filterCity !== "all");
  const hasAnyFilter = hasStageFilter || hasCityFilter;

  let query = db.from("companies").select(PIPELINE_COMPANY_SELECT);

  if (hasSearch) {
    const safe = q!.replace(/[%_,]/g, "");
    query = query.or(
      `name.ilike.%${safe}%,slug.ilike.%${safe}%,phone.ilike.%${safe}%,website.ilike.%${safe}%`
    );
  } else if (!hasAnyFilter) {
    query = query.or(
      "status.eq.claimed,status.eq.verified,pipeline_stage.neq.unclaimed,next_followup_at.not.is.null"
    );
  }

  if (hasStageFilter) {
    query = query.eq("pipeline_stage", params.filterStage! as Database["public"]["Enums"]["pipeline_stage"]);
  }
  if (hasCityFilter) {
    query = query.eq("city", params.filterCity! as Database["public"]["Enums"]["city_slug"]);
  }

  const limit = hasSearch ? 100 : hasAnyFilter ? 200 : 500;
  const { data, error } = await query.order("name").limit(limit);
  if (error) throw error;
  return (data ?? []) as PipelineCompanyRow[];
}

export function formatCityLabel(city: string) {
  return city
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
