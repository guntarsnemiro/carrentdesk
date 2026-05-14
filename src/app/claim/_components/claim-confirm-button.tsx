"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  token: string;
  companyName: string;
  userEmail: string;
}

export function ClaimConfirmButton({ token, companyName, userEmail }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleClaim() {
    setStatus("loading");
    setErrorMsg("");

    const res = await fetch("/api/claim/use", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const json = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorMsg(json.error ?? "Something went wrong. Please try again.");
      return;
    }

    // Success — go to dashboard
    router.push("/app/dashboard?claimed=1");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
        Signed in as <strong>{userEmail}</strong>. Clicking confirm will link
        this account to <strong>{companyName}</strong>.
      </div>

      {errorMsg && (
        <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <button
        onClick={handleClaim}
        disabled={status === "loading"}
        className="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "loading" ? "Activating…" : "Activate my operator account"}
      </button>

      <p className="text-center text-xs text-neutral-400">
        Not you?{" "}
        <a href="/app/login" className="text-brand-700 underline-offset-2 hover:underline">
          Sign in with a different email
        </a>
      </p>
    </div>
  );
}
