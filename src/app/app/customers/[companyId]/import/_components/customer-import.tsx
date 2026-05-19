"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";

type Language = "en" | "lv" | "ru" | "other";

interface ParsedRow {
  full_name: string;
  phone: string;
  email: string | null;
  language: Language | null;
  address: string | null;
  date_of_birth: string | null;
  id_number: string | null;
  id_expiry: string | null;
  driver_license_number: string | null;
  driver_license_expiry: string | null;
  notes: string | null;
  blacklisted: boolean;
  errors: string[];
}

function parseDateStr(val: unknown): string | null {
  if (val == null || val === "") return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const y  = val.getFullYear();
    const mo = String(val.getMonth() + 1).padStart(2, "0");
    const da = String(val.getDate()).padStart(2, "0");
    return `${y}-${mo}-${da}`;
  }
  if (typeof val === "number") {
    // Excel serial — use XLSX utility
    const d = XLSX.SSF.parse_date_code(val);
    if (!d) return null;
    return `${d.y}-${String(d.m).padStart(2,"0")}-${String(d.d).padStart(2,"0")}`;
  }
  const s = String(val).trim();
  if (!s) return null;
  // DD.MM.YYYY or DD/MM/YYYY
  const dmy = s.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]!.padStart(2,"0")}-${dmy[1]!.padStart(2,"0")}`;
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10);
  return null;
}

function str(val: unknown): string {
  return val != null ? String(val).trim() : "";
}

function parseLanguage(val: unknown): Language | null {
  const s = str(val).toLowerCase();
  if (s === "en" || s === "english") return "en";
  if (s === "lv" || s === "latvian" || s === "latviešu") return "lv";
  if (s === "ru" || s === "russian" || s === "русский") return "ru";
  if (s === "other") return "other";
  return null;
}

function parseRow(raw: Record<string, unknown>): ParsedRow {
  const errors: string[] = [];

  const full_name = str(raw["Full Name"] ?? raw["full_name"] ?? raw["Name"] ?? raw["name"]);
  if (!full_name) errors.push("Full name is required");

  const phone = str(raw["Phone"] ?? raw["phone"]);
  if (!phone) errors.push("Phone is required");

  return {
    full_name,
    phone,
    email:                  str(raw["Email"] ?? raw["email"]) || null,
    language:               parseLanguage(raw["Language"] ?? raw["language"]),
    address:                str(raw["Address"] ?? raw["address"]) || null,
    date_of_birth:          parseDateStr(raw["Date of Birth"] ?? raw["date_of_birth"]),
    id_number:              str(raw["ID / Passport"] ?? raw["id_number"]) || null,
    id_expiry:              parseDateStr(raw["ID Expiry"] ?? raw["id_expiry"]),
    driver_license_number:  str(raw["Driver License No"] ?? raw["driver_license_number"]) || null,
    driver_license_expiry:  parseDateStr(raw["Driver License Expiry"] ?? raw["driver_license_expiry"]),
    notes:                  str(raw["Notes"] ?? raw["notes"]) || null,
    blacklisted:            String(raw["Blacklisted"] ?? "").toLowerCase() === "yes",
    errors,
  };
}

export function CustomerImport({ companyId }: { companyId: string }) {
  const [phase, setPhase]             = useState<"idle" | "preview" | "done">("idle");
  const [isImporting, setIsImporting] = useState(false);
  const [rows, setRows]               = useState<ParsedRow[]>([]);
  const [importCount, setImportCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const validRows   = rows.filter((r) => r.errors.length === 0);
  const invalidRows = rows.filter((r) => r.errors.length > 0);
  const phoneSet    = new Set<string>();
  let   dupCount    = 0;
  for (const r of validRows) {
    if (phoneSet.has(r.phone.trim())) dupCount++;
    else phoneSet.add(r.phone.trim());
  }
  const uniqueValidCount = phoneSet.size;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target!.result as ArrayBuffer);
      const wb   = XLSX.read(data, { type: "array", cellDates: true });
      const ws   = wb.Sheets[wb.SheetNames[0]!];
      const raw  = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
      setRows(raw.map(parseRow));
      setPhase("preview");
    };
    reader.readAsArrayBuffer(file);
  }

  async function handleImport() {
    if (!validRows.length) return;
    setIsImporting(true);

    const supabase = getAuthBrowserClient();

    // Deduplicate by phone — last row wins (same as upsert would do)
    const seen = new Map<string, ParsedRow>();
    for (const r of validRows) seen.set(r.phone.trim(), r);
    const uniqueRows = Array.from(seen.values());

    const payload  = uniqueRows.map((r) => ({
      company_id:             companyId,
      full_name:              r.full_name,
      phone:                  r.phone,
      email:                  r.email,
      language:               r.language,
      address:                r.address,
      date_of_birth:          r.date_of_birth,
      id_number:              r.id_number,
      id_expiry:              r.id_expiry,
      driver_license_number:  r.driver_license_number,
      driver_license_expiry:  r.driver_license_expiry,
      notes:                  r.notes,
      blacklisted:            r.blacklisted,
    }));

    const CHUNK = 500;
    for (let i = 0; i < payload.length; i += CHUNK) {
      const { error } = await supabase.from("customers").upsert(payload.slice(i, i + CHUNK), {
        onConflict: "company_id,phone",
        ignoreDuplicates: false,
      });
      if (error) {
        alert(`Import failed on rows ${i + 1}–${Math.min(i + CHUNK, payload.length)}: ${error.message}`);
        setIsImporting(false);
        return;
      }
    }
    setImportCount(uniqueRows.length);
    setPhase("done");
  }

  if (phase === "done") {
    return (
      <div className="rounded-2xl border border-border bg-white px-8 py-12 text-center">
        <p className="text-4xl">✓</p>
        <p className="mt-3 text-lg font-semibold text-neutral-900">
          {importCount} customer{importCount !== 1 ? "s" : ""} imported
        </p>
        <p className="mt-1 text-sm text-neutral-500">Existing records matched by phone were updated.</p>
        <a href={`/app/customers/${companyId}`}
          className="mt-6 inline-block rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">
          View customers
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Download template */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-white px-5 py-4">
        <div>
          <p className="text-sm font-medium text-neutral-900">Step 1 — Download the template</p>
          <p className="mt-0.5 text-xs text-neutral-500">Fill in your customer data and save as .xlsx</p>
        </div>
        <a href="/templates/customer-import-template.xlsx" download
          className="rounded-lg border border-border bg-slate-50 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-slate-100">
          ↓ Download template
        </a>
      </div>

      {/* Upload */}
      <div className="rounded-xl border border-border bg-white px-5 py-4">
        <p className="text-sm font-medium text-neutral-900">Step 2 — Upload your file</p>
        <p className="mt-0.5 mb-3 text-xs text-neutral-500">Accepted: .xlsx, .xls, .csv</p>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv"
          onChange={handleFile}
          className="block w-full text-sm text-neutral-600 file:mr-4 file:rounded-lg file:border file:border-border file:bg-slate-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-neutral-700 hover:file:bg-slate-100" />
      </div>

      {/* Preview */}
      {phase === "preview" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-5 py-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-900">
                {rows.length} row{rows.length !== 1 ? "s" : ""} found
                {" · "}<span className="text-emerald-700">{uniqueValidCount} unique valid</span>
                {invalidRows.length > 0 && (
                  <span className="text-red-600"> · {invalidRows.length} with errors</span>
                )}
                {dupCount > 0 && (
                  <span className="text-amber-600"> · {dupCount} duplicate phone{dupCount !== 1 ? "s" : ""} (last row kept)</span>
                )}
              </p>
            </div>
            <button onClick={handleImport} disabled={!validRows.length || isImporting}
              className="rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
              {isImporting ? "Importing…" : `Import ${uniqueValidCount} customer${uniqueValidCount !== 1 ? "s" : ""}`}
            </button>
          </div>

          {/* Error rows */}
          {invalidRows.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
              <p className="mb-2 text-sm font-semibold text-red-700">Rows with errors (will be skipped):</p>
              <ul className="space-y-1">
                {invalidRows.map((r, i) => (
                  <li key={i} className="text-xs text-red-600">
                    <span className="font-medium">{r.full_name || "(no name)"}</span>
                    {" — "}{r.errors.join(", ")}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview table */}
          <div className="overflow-x-auto rounded-xl border border-border bg-white">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50 text-left text-xs">
                  <th className="px-3 py-2 font-medium text-neutral-500">Name</th>
                  <th className="px-3 py-2 font-medium text-neutral-500">Phone</th>
                  <th className="px-3 py-2 font-medium text-neutral-500">Email</th>
                  <th className="px-3 py-2 font-medium text-neutral-500">Language</th>
                  <th className="px-3 py-2 font-medium text-neutral-500">DOB</th>
                  <th className="px-3 py-2 font-medium text-neutral-500">Notes</th>
                  <th className="px-3 py-2 font-medium text-neutral-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r, i) => (
                  <tr key={i} className={r.errors.length ? "bg-red-50" : "hover:bg-slate-50"}>
                    <td className="px-3 py-2 font-medium text-neutral-900">{r.full_name || "—"}</td>
                    <td className="px-3 py-2 text-neutral-600">{r.phone || "—"}</td>
                    <td className="px-3 py-2 text-neutral-500">{r.email ?? "—"}</td>
                    <td className="px-3 py-2 text-neutral-500 uppercase">{r.language ?? "—"}</td>
                    <td className="px-3 py-2 text-neutral-500">{r.date_of_birth ?? "—"}</td>
                    <td className="px-3 py-2 text-neutral-400 max-w-[160px] truncate">{r.notes ?? "—"}</td>
                    <td className="px-3 py-2">
                      {r.errors.length > 0
                        ? <span className="text-xs text-red-600">⚠ {r.errors[0]}</span>
                        : <span className="text-xs text-emerald-700">✓ OK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
