import { REASON_LABELS, SEVERITY_LABELS } from "@/lib/blacklist-shared";

export interface MatchResult {
  id: string;
  reason_category: string;
  severity: number;
  country: string | null;
  notes_public: string | null;
  submitted_at: string;
  strength: "strong" | "soft";
  matched_on: string;
}

export function GlobalMatchCards({ matches }: { matches: MatchResult[] }) {
  if (matches.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        No matches found in the approved global blacklist network.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
        ⚠ {matches.length} {matches.length === 1 ? "match" : "matches"} found in the global network.
      </div>
      {matches.map((m) => {
        const sev = SEVERITY_LABELS[m.severity as 1 | 2 | 3];
        const isStrong = m.strength === "strong";
        return (
          <div
            key={m.id}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
              isStrong ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"
            }`}
          >
            <div className="flex shrink-0 flex-col gap-1 pt-0.5">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${sev.cls}`}>
                {sev.label}
              </span>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                  isStrong ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {isStrong ? "Strong match" : "Soft match"}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-800">
                {REASON_LABELS[m.reason_category] ?? m.reason_category}
                {m.country ? ` · ${m.country}` : ""}
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">
                Matched on: <strong>{m.matched_on}</strong>
              </p>
              {m.notes_public && (
                <p className="mt-1 text-xs text-neutral-600 italic">&ldquo;{m.notes_public}&rdquo;</p>
              )}
              <p className="mt-1 text-xs text-neutral-400">
                Reported {new Date(m.submitted_at).toLocaleDateString("en-GB")}
              </p>
            </div>
          </div>
        );
      })}
      <p className="text-xs text-neutral-500">
        Matching uses one-way hashes — no personal data is shared between companies.
      </p>
    </div>
  );
}
