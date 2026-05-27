"use client";

import { useState, useTransition, useMemo, useRef, useCallback, useEffect } from "react";
import { logOutreach, updatePipelineStage, updateCompanyCrm } from "../_actions";
import type { PipelineStage, OutreachChannel, OutreachOutcome } from "../_actions";

type Company = {
  id: string; name: string; slug: string; city: string; country: string;
  phone: string | null; website: string | null; whatsapp: string | null;
  pipeline_stage: string; contact_person: string | null;
  next_followup_at: string | null; outreach_notes: string | null;
  fleet_size: number | null; status: string; claimed_at: string | null;
};

type Log = {
  id: string; company_id: string; channel: string; outcome: string;
  notes: string | null; contacted_at: string;
};

interface Props {
  companies: Company[];
  logsByCompany: Record<string, Log[]>;
  todayStr: string;
}

const STAGE_LABELS: Record<string, string> = {
  unclaimed: "Not contacted",
  contacted: "Contacted",
  interested: "Interested",
  trial: "Trial",
  active: "Active",
  not_interested: "Not interested",
};

const STAGE_COLORS: Record<string, string> = {
  unclaimed: "bg-neutral-100 text-neutral-600",
  contacted: "bg-blue-100 text-blue-700",
  interested: "bg-amber-100 text-amber-700",
  trial: "bg-violet-100 text-violet-700",
  active: "bg-emerald-100 text-emerald-700",
  not_interested: "bg-red-50 text-red-500",
};

const CITY_LABELS: Record<string, string> = {
  riga: "Riga", tallinn: "Tallinn", vilnius: "Vilnius", parnu: "Pärnu", kaunas: "Kaunas",
};

const CHANNELS: { value: OutreachChannel; label: string }[] = [
  { value: "call", label: "📞 Call" },
  { value: "email", label: "✉️ Email" },
  { value: "whatsapp", label: "💬 WhatsApp" },
  { value: "linkedin", label: "💼 LinkedIn" },
  { value: "other", label: "Other" },
];

const OUTCOMES: { value: OutreachOutcome; label: string }[] = [
  { value: "no_answer", label: "No answer" },
  { value: "left_message", label: "Left message" },
  { value: "spoke", label: "Spoke to them" },
  { value: "interested", label: "Interested" },
  { value: "not_interested", label: "Not interested" },
  { value: "callback_requested", label: "Callback requested" },
  { value: "other", label: "Other" },
];

const STAGES: PipelineStage[] = ["unclaimed", "contacted", "interested", "trial", "active", "not_interested"];

const MIN_PANEL_WIDTH = 380;
const MAX_PANEL_WIDTH = 800;
const DEFAULT_PANEL_WIDTH = 480;

export function PipelineClient({ companies, logsByCompany, todayStr }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStage, setFilterStage] = useState<string>("all");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showLogForm, setShowLogForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_PANEL_WIDTH);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = panelWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [panelWidth]);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isResizing.current) return;
      const delta = startX.current - e.clientX;
      const newWidth = Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, startWidth.current + delta));
      setPanelWidth(newWidth);
    }
    function onMouseUp() {
      if (!isResizing.current) return;
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const selected = companies.find((c) => c.id === selectedId) ?? null;
  const logs = selectedId ? (logsByCompany[selectedId] ?? []) : [];

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      if (filterStage !== "all" && c.pipeline_stage !== filterStage) return false;
      if (filterCity !== "all" && c.city !== filterCity) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !(c.phone ?? "").includes(q)) return false;
      }
      return true;
    });
  }, [companies, filterStage, filterCity, search]);

  const dueToday = companies.filter((c) => c.next_followup_at === todayStr);
  const overdue = companies.filter((c) => c.next_followup_at && c.next_followup_at < todayStr);

  function fmtDate(d: string | null) {
    if (!d) return "—";
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  }

  function handleStageChange(companyId: string, stage: PipelineStage) {
    startTransition(() => updatePipelineStage(companyId, stage));
  }

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of companies) counts[c.pipeline_stage] = (counts[c.pipeline_stage] ?? 0) + 1;
    return counts;
  }, [companies]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main panel */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-white px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">Sales Pipeline</h1>
            <p className="text-sm text-neutral-500">{companies.length} companies · {companies.filter(c => c.pipeline_stage === "active").length} active customers</p>
          </div>
          <div className="flex items-center gap-2">
            {overdue.length > 0 && (
              <button
                onClick={() => { setFilterStage("all"); setSearch(""); }}
                className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100"
              >
                <span className="h-2 w-2 rounded-full bg-red-500" />
                {overdue.length} overdue
              </button>
            )}
            {dueToday.length > 0 && (
              <button
                onClick={() => { setFilterStage("all"); setSearch(""); }}
                className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100"
              >
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                {dueToday.length} due today
              </button>
            )}
          </div>
        </div>

        {/* Stage summary bar */}
        <div className="flex gap-1.5 overflow-x-auto border-b border-border bg-white px-6 pb-3 pt-3">
          {STAGES.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStage(filterStage === s ? "all" : s)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                filterStage === s
                  ? STAGE_COLORS[s] + " ring-2 ring-offset-1 ring-current"
                  : STAGE_COLORS[s] + " opacity-70 hover:opacity-100"
              }`}
            >
              {STAGE_LABELS[s]}
              <span className="rounded-full bg-white/60 px-1.5 py-0.5 font-semibold tabular-nums">
                {stageCounts[s] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 border-b border-border bg-neutral-50 px-6 py-2">
          <input
            type="text"
            placeholder="Search company or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-56 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="h-8 rounded-lg border border-border bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          >
            <option value="all">All cities</option>
            {Object.entries(CITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <span className="ml-auto text-sm text-neutral-400">{filtered.length} shown</span>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-neutral-50">
              <tr className="border-b border-border">
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Company</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">City</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Phone</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Contact</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Stage</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Follow-up</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Fleet</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Calls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => {
                const callCount = (logsByCompany[c.id] ?? []).length;
                const isOverdue = c.next_followup_at && c.next_followup_at < todayStr;
                const isDueToday = c.next_followup_at === todayStr;
                const isSelected = c.id === selectedId;
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedId(c.id === selectedId ? null : c.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-violet-50" : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-neutral-800">{c.name}</div>
                      {c.website && (
                        <a
                          href={c.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-neutral-400 hover:text-violet-600"
                        >
                          {c.website.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-500">{CITY_LABELS[c.city] ?? c.city}</td>
                    <td className="px-4 py-2.5">
                      {c.phone ? (
                        <a
                          href={`tel:${c.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-mono text-xs text-neutral-700 hover:text-violet-700"
                        >
                          {c.phone}
                        </a>
                      ) : (
                        <span className="text-neutral-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-500">{c.contact_person ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_COLORS[c.pipeline_stage]}`}>
                        {STAGE_LABELS[c.pipeline_stage] ?? c.pipeline_stage}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-medium ${isOverdue ? "text-red-600" : isDueToday ? "text-amber-600" : "text-neutral-500"}`}>
                        {isOverdue && "⚠ "}{isDueToday && "● "}{fmtDate(c.next_followup_at)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-neutral-500">{c.fleet_size ? `~${c.fleet_size}` : "—"}</td>
                    <td className="px-4 py-2.5 text-neutral-500">{callCount > 0 ? callCount : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-16 text-neutral-400">
              <span className="text-4xl">🔍</span>
              <p>No companies match the current filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Side panel */}
      {selected && (
        <div style={{ width: panelWidth }} className="relative shrink-0 flex">
          {/* Drag handle */}
          <div
            onMouseDown={onMouseDown}
            className="absolute left-0 top-0 h-full w-1.5 cursor-col-resize bg-transparent hover:bg-violet-300 transition-colors z-10"
            title="Drag to resize"
          />
          <SidePanel
            company={selected}
            logs={logs}
            isPending={isPending}
            showLogForm={showLogForm}
            setShowLogForm={setShowLogForm}
            onClose={() => setSelectedId(null)}
            onStageChange={handleStageChange}
            fmtDate={fmtDate}
            todayStr={todayStr}
          />
        </div>
      )}
    </div>
  );
}

function SidePanel({
  company, logs, isPending, showLogForm, setShowLogForm,
  onClose, onStageChange, fmtDate, todayStr,
}: {
  company: Company;
  logs: Log[];
  isPending: boolean;
  showLogForm: boolean;
  setShowLogForm: (v: boolean) => void;
  onClose: () => void;
  onStageChange: (id: string, stage: PipelineStage) => void;
  fmtDate: (d: string | null) => string;
  todayStr: string;
}) {
  const [isPendingForm, startTransition] = useTransition();

  const [channel, setChannel] = useState<OutreachChannel>("call");
  const [outcome, setOutcome] = useState<OutreachOutcome>("no_answer");
  const [notes, setNotes] = useState("");
  const [contactedAt, setContactedAt] = useState(todayStr);
  const [newStage, setNewStage] = useState<PipelineStage>(company.pipeline_stage as PipelineStage);
  const [contactPerson, setContactPerson] = useState(company.contact_person ?? "");
  const [followupDate, setFollowupDate] = useState(company.next_followup_at ?? "");
  const [fleetSize, setFleetSize] = useState(company.fleet_size?.toString() ?? "");

  function handleLog(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await logOutreach({
        company_id: company.id,
        channel,
        outcome,
        notes,
        contacted_at: contactedAt + "T12:00:00Z",
        next_followup_at: followupDate || undefined,
        pipeline_stage: newStage,
        contact_person: contactPerson || undefined,
      });
      if (fleetSize) {
        await updateCompanyCrm(company.id, { fleet_size: parseInt(fleetSize) || null });
      }
      setShowLogForm(false);
      setNotes("");
    });
  }

  return (
    <aside className="flex flex-1 flex-col border-l border-border bg-white overflow-hidden">
      {/* Panel header */}
      <div className="flex items-start justify-between border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-neutral-900">{company.name}</h2>
          <p className="text-xs text-neutral-400">{CITY_LABELS[company.city] ?? company.city} · {company.country}</p>
        </div>
        <button onClick={onClose} className="ml-3 shrink-0 rounded-lg p-1.5 text-neutral-400 hover:bg-slate-100">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Contact info */}
        <div className="border-b border-border px-5 py-4 space-y-2">
          {company.phone && (
            <a href={`tel:${company.phone}`} className="flex items-center gap-2 text-sm text-neutral-700 hover:text-violet-700">
              <span className="text-base">📞</span> {company.phone}
            </a>
          )}
          {company.whatsapp && (
            <a href={`https://wa.me/${company.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-neutral-700 hover:text-green-700">
              <span className="text-base">💬</span> WhatsApp
            </a>
          )}
          {company.website && (
            <a href={company.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-neutral-700 hover:text-violet-700">
              <span className="text-base">🌐</span> {company.website.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
            </a>
          )}
        </div>

        {/* Stage selector */}
        <div className="border-b border-border px-5 py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Stage</p>
          <div className="flex flex-wrap gap-1.5">
            {STAGES.map((s) => (
              <button
                key={s}
                onClick={() => onStageChange(company.id, s)}
                disabled={isPending}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  company.pipeline_stage === s
                    ? STAGE_COLORS[s] + " ring-2 ring-offset-1 ring-current"
                    : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                }`}
              >
                {STAGE_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* CRM meta */}
        <div className="border-b border-border px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Contact person</p>
              <p className="text-sm text-neutral-700">{company.contact_person || <span className="text-neutral-300">Not set</span>}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Fleet size</p>
              <p className="text-sm text-neutral-700">{company.fleet_size ? `~${company.fleet_size} cars` : <span className="text-neutral-300">Unknown</span>}</p>
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Next follow-up</p>
            <p className={`text-sm font-medium ${
              company.next_followup_at && company.next_followup_at < todayStr ? "text-red-600" :
              company.next_followup_at === todayStr ? "text-amber-600" : "text-neutral-700"
            }`}>
              {fmtDate(company.next_followup_at)}
            </p>
          </div>
          {company.outreach_notes && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Notes</p>
              <p className="whitespace-pre-wrap text-sm text-neutral-700">{company.outreach_notes}</p>
            </div>
          )}
        </div>

        {/* Log call button */}
        {!showLogForm && (
          <div className="px-5 py-4">
            <button
              onClick={() => setShowLogForm(true)}
              className="w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 active:bg-violet-800"
            >
              + Log contact
            </button>
          </div>
        )}

        {/* Log form */}
        {showLogForm && (
          <form onSubmit={handleLog} className="border-b border-border px-5 py-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Log contact</p>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-neutral-500">Channel</label>
                <select value={channel} onChange={(e) => setChannel(e.target.value as OutreachChannel)}
                  className="w-full rounded-lg border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                  {CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-neutral-500">Outcome</label>
                <select value={outcome} onChange={(e) => setOutcome(e.target.value as OutreachOutcome)}
                  className="w-full rounded-lg border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                  {OUTCOMES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-neutral-500">Date</label>
              <input type="date" value={contactedAt} onChange={(e) => setContactedAt(e.target.value)}
                className="w-full rounded-lg border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>

            <div>
              <label className="mb-1 block text-xs text-neutral-500">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="What was discussed…"
                className="w-full rounded-lg border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-neutral-500">Contact person</label>
                <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Name"
                  className="w-full rounded-lg border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-neutral-500">Fleet size (cars)</label>
                <input type="number" min="1" value={fleetSize} onChange={(e) => setFleetSize(e.target.value)} placeholder="e.g. 12"
                  className="w-full rounded-lg border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-neutral-500">Move stage to</label>
              <select value={newStage} onChange={(e) => setNewStage(e.target.value as PipelineStage)}
                className="w-full rounded-lg border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-neutral-500">Next follow-up date</label>
              <input type="date" value={followupDate} onChange={(e) => setFollowupDate(e.target.value)}
                className="w-full rounded-lg border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={isPendingForm}
                className="flex-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60">
                {isPendingForm ? "Saving…" : "Save"}
              </button>
              <button type="button" onClick={() => setShowLogForm(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-neutral-600 hover:bg-slate-50">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Call history */}
        <div className="px-5 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            History ({logs.length})
          </p>
          {logs.length === 0 ? (
            <p className="text-sm text-neutral-400">No contacts logged yet.</p>
          ) : (
            <ul className="space-y-3">
              {logs.map((log) => (
                <li key={log.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        {log.channel}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        log.outcome === "interested" ? "bg-emerald-100 text-emerald-700" :
                        log.outcome === "not_interested" ? "bg-red-50 text-red-500" :
                        log.outcome === "spoke" ? "bg-blue-100 text-blue-700" :
                        "bg-neutral-100 text-neutral-500"
                      }`}>
                        {OUTCOMES.find((o) => o.value === log.outcome)?.label ?? log.outcome}
                      </span>
                    </div>
                    <span className="text-xs text-neutral-400">{log.contacted_at.slice(0, 10).split("-").reverse().join("/")}</span>
                  </div>
                  {log.notes && <p className="mt-1.5 text-sm text-neutral-600">{log.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
