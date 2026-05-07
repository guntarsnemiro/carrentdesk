type ModuleStatus = "live" | "q3_2026" | "q4_2026" | "q1_2027" | "q2_2027" | "q3_2027" | "q4_2027";

type Module = {
  title: string;
  status: ModuleStatus;
  description: string;
};

const STATUS_LABELS: Record<ModuleStatus, string> = {
  live: "Live today",
  q3_2026: "Q3 2026",
  q4_2026: "Q4 2026",
  q1_2027: "Q1 2027",
  q2_2027: "Q2 2027",
  q3_2027: "Q3 2027",
  q4_2027: "Q4 2027",
};

const MODULES: Module[] = [
  {
    title: "Inspection",
    status: "live",
    description:
      "Tap-to-pin damage, photo capture, customer signature, locked PDF reports.",
  },
  {
    title: "Fleet",
    status: "q3_2026",
    description:
      "Vehicle profiles, utilization rate, profit per car, maintenance scheduling.",
  },
  {
    title: "Demand & revenue",
    status: "q4_2026",
    description:
      "Bookings, dynamic pricing, availability calendar, quote generation.",
  },
  {
    title: "Customer",
    status: "q1_2027",
    description:
      "Customer profiles, license & document storage, rental history, blacklist.",
  },
  {
    title: "Automation",
    status: "q2_2027",
    description:
      "Pickup → return workflow, task pipeline, deadline alerts, staff handoffs.",
  },
  {
    title: "Financial",
    status: "q2_2027",
    description:
      "Revenue, costs, profit dashboards. Per-vehicle and per-location breakdowns.",
  },
  {
    title: "Sales & growth",
    status: "q3_2027",
    description:
      "Lead pipeline, conversion tracking, ROI per channel, marketplace analytics.",
  },
  {
    title: "Compliance & risk",
    status: "q3_2027",
    description:
      "GDPR audit logs, risk scoring, document retention, dispute archive.",
  },
  {
    title: "Multi-location",
    status: "q4_2027",
    description:
      "Branches, shared fleet, transfers between locations, per-branch staff.",
  },
];

export function ModuleGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {MODULES.map((m) => (
        <ModuleCard key={m.title} module={m} />
      ))}
    </div>
  );
}

function ModuleCard({ module: m }: { module: Module }) {
  const isLive = m.status === "live";
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl p-5 ring-1 transition-colors ${
        isLive
          ? "bg-brand-950 text-white ring-brand-800"
          : "bg-background text-brand-950 ring-border hover:ring-brand-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight">{m.title}</h3>
        <StatusBadge status={m.status} />
      </div>
      <p
        className={`text-sm leading-6 ${
          isLive ? "text-brand-100" : "text-neutral-600"
        }`}
      >
        {m.description}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: ModuleStatus }) {
  const isLive = status === "live";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
        isLive
          ? "bg-success/15 text-success ring-1 ring-success/40"
          : "bg-surface-soft text-neutral-600 ring-1 ring-border"
      }`}
    >
      {isLive && <span aria-hidden className="size-1.5 rounded-full bg-success" />}
      {STATUS_LABELS[status]}
    </span>
  );
}
