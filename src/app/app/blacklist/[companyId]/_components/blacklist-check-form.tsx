"use client";

import { useState } from "react";
import { lookupGlobalBlacklist } from "@/app/actions/blacklist";
import { GlobalMatchCards, type MatchResult } from "./global-match-cards";

interface Props {
  companyId: string;
}

const inp =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500";

export function BlacklistCheckForm({ companyId }: Props) {
  const [form, setForm] = useState({
    idNumber: "",
    licenseNumber: "",
    passportNumber: "",
    fullName: "",
    dateOfBirth: "",
  });
  const [status, setStatus] = useState<"idle" | "checking" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [matches, setMatches] = useState<MatchResult[] | null>(null);

  function setField(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (status === "done" || status === "error") {
      setStatus("idle");
      setMatches(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("checking");
    setError("");
    setMatches(null);

    const result = await lookupGlobalBlacklist(companyId, {
      idNumber: form.idNumber || null,
      licenseNumber: form.licenseNumber || null,
      passportNumber: form.passportNumber || null,
      fullName: form.fullName || null,
      dateOfBirth: form.dateOfBirth || null,
    });

    if (!result.ok) {
      setError(result.error);
      setStatus("error");
      return;
    }

    setMatches(result.matches);
    setStatus("done");
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-neutral-500">
          Enter any available documents to check against approved reports from other rental companies.
          At least one document number, or name + date of birth, is required.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="National ID / personal code" name="idNumber" value={form.idNumber} onChange={setField} />
          <Field label="Driver's license" name="licenseNumber" value={form.licenseNumber} onChange={setField} />
          <Field label="Passport number" name="passportNumber" value={form.passportNumber} onChange={setField} />
          <Field label="Full name" name="fullName" value={form.fullName} onChange={setField} />
          <Field
            label="Date of birth"
            name="dateOfBirth"
            value={form.dateOfBirth}
            onChange={setField}
            type="date"
            hint="Required together with full name for a name-based check."
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={status === "checking"}
          className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
        >
          {status === "checking" ? "Checking…" : "Check customer"}
        </button>
      </form>

      {matches !== null && (
        <div className="mt-6">
          <GlobalMatchCards matches={matches} />
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  hint,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-neutral-700">{label}</label>
      {hint && <p className="mb-1 text-xs text-neutral-400">{hint}</p>}
      <input type={type} name={name} value={value} onChange={onChange} className={inp} />
    </div>
  );
}
