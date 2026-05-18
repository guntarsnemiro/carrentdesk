"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { read, utils } from "xlsx";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";

type Fuel     = "diesel" | "petrol" | "electric" | "hybrid" | "lpg";
type Category = "economy" | "compact" | "midsize" | "suv" | "van" | "luxury" | "other";

const VALID_FUELS: Fuel[]         = ["diesel", "petrol", "electric", "hybrid", "lpg"];
const VALID_CATS:  Category[]     = ["economy", "compact", "midsize", "suv", "van", "luxury", "other"];

interface ParsedRow {
  rowNum: number;
  make: string;
  model: string;
  year: number;
  plate: string;
  fuel: Fuel;
  seats: number;
  color: string | null;
  category: Category;
  vin: string | null;
  registration_number: string | null;
  odometer_km: number | null;
  gov_inspection_date: string | null;
  gov_inspection_next: string | null;
  service_date: string | null;
  service_next: string | null;
  insurance_number: string | null;
  insurance_valid_until: string | null;
  notes: string | null;
  errors: string[];
}

function parseDateStr(val: unknown): string | null {
  if (!val) return null;

  // JS Date object — when Excel auto-formats cells as dates (cellDates: true)
  if (val instanceof Date && !isNaN(val.getTime())) {
    const y  = val.getUTCFullYear();
    const mo = String(val.getUTCMonth() + 1).padStart(2, "0");
    const da = String(val.getUTCDate()).padStart(2, "0");
    return `${y}-${mo}-${da}`;
  }

  const s = String(val).trim();
  if (!s) return null;

  // D/M/YYYY or DD/MM/YYYY (European style — 9/6/2026 or 09/06/2026)
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]!.padStart(2,"0")}-${dmy[1]!.padStart(2,"0")}`;

  // YYYY-MM-DD passthrough
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // Excel date serial number fallback (e.g. 46000)
  const num = Number(s);
  if (!isNaN(num) && num > 40000 && num < 70000) {
    const d  = new Date(Math.round((num - 25569) * 86400 * 1000));
    const y  = d.getUTCFullYear();
    const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
    const da = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${mo}-${da}`;
  }

  return null;
}

function str(val: unknown): string {
  return val != null ? String(val).trim() : "";
}

function parseRow(raw: Record<string, unknown>, rowNum: number): ParsedRow {
  const errors: string[] = [];

  const make  = str(raw["Make"]  ?? raw["make"]);
  const model = str(raw["Model"] ?? raw["model"]);
  const yearRaw = raw["Year"] ?? raw["year"];
  const year  = yearRaw ? parseInt(String(yearRaw), 10) : NaN;
  const plate = str(raw["Plate"] ?? raw["plate"]).toUpperCase();
  const fuelRaw = str(raw["Fuel"] ?? raw["fuel"]).toLowerCase() as Fuel;
  const seatsRaw = raw["Seats"] ?? raw["seats"];
  const seats = seatsRaw ? parseInt(String(seatsRaw), 10) : NaN;

  if (!make)              errors.push("Make is required");
  if (!model)             errors.push("Model is required");
  if (isNaN(year))        errors.push("Year must be a number");
  if (!plate)             errors.push("Plate is required");
  if (!VALID_FUELS.includes(fuelRaw)) errors.push(`Fuel must be one of: ${VALID_FUELS.join(", ")}`);
  if (isNaN(seats) || seats < 1 || seats > 20) errors.push("Seats must be a number 1–20");

  const catRaw = str(raw["Category"] ?? raw["category"]).toLowerCase() as Category;
  const category: Category = VALID_CATS.includes(catRaw) ? catRaw : "other";

  const odomRaw = raw["Odometer (km)"] ?? raw["odometer_km"] ?? raw["Odometer"];
  const odometer_km = odomRaw ? parseInt(String(odomRaw), 10) || null : null;

  return {
    rowNum,
    make, model,
    year: isNaN(year) ? 0 : year,
    plate,
    fuel: VALID_FUELS.includes(fuelRaw) ? fuelRaw : "petrol",
    seats: isNaN(seats) ? 0 : seats,
    color:                str(raw["Color"] ?? raw["color"]) || null,
    category,
    vin:                  str(raw["VIN"] ?? raw["vin"]) || null,
    registration_number:  str(raw["Registration Number"] ?? raw["registration_number"]) || null,
    odometer_km,
    gov_inspection_date:  parseDateStr(raw["Gov Inspection Last (DD/MM/YYYY)"] ?? raw["gov_inspection_date"]),
    gov_inspection_next:  parseDateStr(raw["Gov Inspection Next (DD/MM/YYYY)"] ?? raw["gov_inspection_next"]),
    service_date:         parseDateStr(raw["Service Last (DD/MM/YYYY)"]        ?? raw["service_date"]),
    service_next:         parseDateStr(raw["Service Next (DD/MM/YYYY)"]        ?? raw["service_next"]),
    insurance_number:     str(raw["Insurance Number"] ?? raw["insurance_number"]) || null,
    insurance_valid_until:parseDateStr(raw["Insurance Valid Until (DD/MM/YYYY)"] ?? raw["insurance_valid_until"]),
    notes:                str(raw["Notes"] ?? raw["notes"]) || null,
    errors,
  };
}

export function FleetImport({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [rows, setRows]         = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [phase, setPhase]       = useState<"idle" | "preview" | "importing" | "done">("idle");
  const [importCount, setImportCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const validRows   = rows.filter((r) => r.errors.length === 0);
  const invalidRows = rows.filter((r) => r.errors.length > 0);

  function parseFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb   = read(data, { type: "array", cellDates: true });
        const ws   = wb.Sheets[wb.SheetNames[0]!]!;
        const raw  = utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
        const parsed = raw.map((r, i) => parseRow(r, i + 2)); // row 1 = header
        setRows(parsed);
        setFileName(file.name);
        setPhase("preview");
      } catch {
        alert("Could not read the file. Make sure it is a valid .xlsx or .csv file.");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  }

  async function handleImport() {
    if (!validRows.length) return;
    setPhase("importing");
    const supabase = getAuthBrowserClient();

    const payload = validRows.map((r) => ({
      company_id:            companyId,
      make:                  r.make,
      model:                 r.model,
      year:                  r.year,
      plate:                 r.plate,
      fuel:                  r.fuel,
      seats:                 r.seats,
      color:                 r.color,
      category:              r.category,
      vin:                   r.vin,
      registration_number:   r.registration_number,
      odometer_km:           r.odometer_km,
      gov_inspection_date:   r.gov_inspection_date,
      gov_inspection_next:   r.gov_inspection_next,
      service_date:          r.service_date,
      service_next:          r.service_next,
      insurance_number:      r.insurance_number,
      insurance_valid_until: r.insurance_valid_until,
      notes:                 r.notes,
      status:                "available" as const,
    }));

    const { error } = await supabase.from("vehicles").insert(payload);
    if (error) {
      alert("Import failed: " + error.message);
      setPhase("preview");
      return;
    }
    setImportCount(validRows.length);
    setPhase("done");
  }

  function reset() {
    setRows([]);
    setFileName("");
    setPhase("idle");
    setImportCount(0);
  }

  /* ── Done ── */
  if (phase === "done") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-8 py-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-emerald-900">
          {importCount} {importCount === 1 ? "vehicle" : "vehicles"} imported successfully!
        </p>
        {invalidRows.length > 0 && (
          <p className="mt-1 text-sm text-emerald-700">{invalidRows.length} rows were skipped due to errors.</p>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => { router.push(`/app/fleet/${companyId}`); router.refresh(); }}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
            View fleet
          </button>
          <button onClick={reset}
            className="rounded-lg border border-border bg-white px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-slate-50">
            Import another file
          </button>
        </div>
      </div>
    );
  }

  /* ── Preview ── */
  if (phase === "preview" || phase === "importing") {
    return (
      <div className="space-y-5">
        {/* Summary */}
        <div className="flex items-center gap-4 rounded-xl border border-border bg-white px-5 py-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-neutral-900">{fileName}</p>
            <p className="mt-0.5 text-sm text-neutral-500">
              {rows.length} rows parsed —{" "}
              <span className="font-semibold text-emerald-600">{validRows.length} ready to import</span>
              {invalidRows.length > 0 && (
                <span className="ml-1 font-semibold text-red-500">, {invalidRows.length} with errors</span>
              )}
            </p>
          </div>
          <button onClick={reset} className="text-sm text-neutral-400 hover:text-neutral-600">
            ✕ Clear
          </button>
        </div>

        {/* Errors */}
        {invalidRows.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="mb-2 text-sm font-semibold text-red-800">Rows with errors (will be skipped):</p>
            <div className="space-y-1.5">
              {invalidRows.map((r) => (
                <div key={r.rowNum} className="text-sm text-red-700">
                  <span className="font-mono font-medium">Row {r.rowNum}:</span>{" "}
                  {r.make || r.model ? `${r.make} ${r.model} — ` : ""}{r.errors.join(", ")}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview table */}
        {validRows.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-border bg-white">
            <div className="border-b border-border px-5 py-3">
              <p className="text-sm font-semibold text-neutral-900">Preview — {validRows.length} vehicles ready</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-slate-50 text-left text-[11px]">
                    {["Make","Model","Year","Plate","Fuel","Seats","Color","Category"].map((h) => (
                      <th key={h} className="px-3 py-2.5 font-medium text-neutral-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {validRows.map((r) => (
                    <tr key={r.rowNum} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium text-neutral-900">{r.make}</td>
                      <td className="px-3 py-2 text-neutral-700">{r.model}</td>
                      <td className="px-3 py-2 text-neutral-600">{r.year}</td>
                      <td className="px-3 py-2 font-mono text-neutral-700">{r.plate}</td>
                      <td className="px-3 py-2 capitalize text-neutral-600">{r.fuel}</td>
                      <td className="px-3 py-2 text-neutral-600">{r.seats}</td>
                      <td className="px-3 py-2 text-neutral-500">{r.color ?? "—"}</td>
                      <td className="px-3 py-2 capitalize text-neutral-500">{r.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleImport}
            disabled={validRows.length === 0 || phase === "importing"}
            className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
          >
            {phase === "importing" ? "Importing…" : `Import ${validRows.length} vehicles`}
          </button>
          <button onClick={reset} className="text-sm text-neutral-500 hover:text-neutral-700">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  /* ── Idle / Upload ── */
  return (
    <div className="space-y-6">
      {/* Download template */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-white px-5 py-4">
        <div>
          <p className="text-sm font-medium text-neutral-900">Download the template first</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Fill it in with your fleet data, then upload it below. Includes two example rows and a field reference sheet.
          </p>
        </div>
        <a
          href="/templates/fleet-import-template.xlsx"
          download
          className="ml-4 shrink-0 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
        >
          ↓ Download template
        </a>
      </div>

      {/* Drop zone */}
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-8 py-16 text-center transition-colors
          ${dragOver ? "border-brand-400 bg-brand-50" : "border-border bg-white hover:border-brand-300 hover:bg-slate-50"}`}
      >
        <svg className="h-10 w-10 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-neutral-700">Drop your Excel or CSV file here</p>
          <p className="mt-1 text-xs text-neutral-400">or click to browse — .xlsx and .csv supported</p>
        </div>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={onFileInput} className="hidden" />
      </label>
    </div>
  );
}
