"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";

type CityOption = { slug: string; name: string; country: string };
type CountryOption = { code: string; name: string };

const inputClass =
  "mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500";

// ── City search combobox ──────────────────────────────────────────────────────

function CityCombobox({
  cityOptions,
  countryOptions,
  onSelect,
}: {
  cityOptions: CityOption[];
  countryOptions: CountryOption[];
  onSelect: (params: { isCustom: boolean; citySlug: string; customCityName: string; countryCode: string; countryName: string }) => void;
}) {
  const [query, setQuery]       = useState("");
  const [open, setOpen]         = useState(false);
  const [selected, setSelected] = useState<string>(""); // display label once chosen
  const [addMode, setAddMode]   = useState(false);      // country picker visible
  const [countryCode, setCountryCode] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim().length === 0
    ? cityOptions.slice(0, 8)
    : cityOptions.filter((c) =>
        `${c.name} ${c.country}`.toLowerCase().includes(query.trim().toLowerCase())
      ).slice(0, 8);

  const showAdd = query.trim().length >= 2 && filtered.length < cityOptions.length;

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setAddMode(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function pickKnown(c: CityOption) {
    setSelected(`${c.name}, ${c.country}`);
    setQuery(`${c.name}, ${c.country}`);
    setOpen(false);
    setAddMode(false);
    onSelect({ isCustom: false, citySlug: c.slug, customCityName: "", countryCode: "", countryName: "" });
  }

  function startAdd() {
    setAddMode(true);
    setOpen(false);
  }

  function confirmAdd() {
    if (!query.trim() || !countryCode) return;
    const country = countryOptions.find((c) => c.code === countryCode);
    setSelected(`${query.trim()}, ${country?.name ?? countryCode}`);
    setAddMode(false);
    onSelect({ isCustom: true, citySlug: "", customCityName: query.trim(), countryCode, countryName: country?.name ?? "" });
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        autoComplete="off"
        placeholder="Type your city…"
        value={selected || query}
        onFocus={() => { if (!selected) setOpen(true); }}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelected("");
          setOpen(true);
          setAddMode(false);
          onSelect({ isCustom: false, citySlug: "", customCityName: "", countryCode: "", countryName: "" });
        }}
        className={inputClass}
      />

      {/* Dropdown */}
      {open && !addMode && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-border bg-white py-1 shadow-lg">
          {filtered.length === 0 && (
            <p className="px-4 py-2 text-sm text-neutral-400">No cities found.</p>
          )}
          {filtered.map((c) => (
            <button
              key={c.slug}
              type="button"
              onMouseDown={() => pickKnown(c)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-slate-50"
            >
              <span className="font-medium text-neutral-900">{c.name}</span>
              <span className="text-xs text-neutral-400">{c.country}</span>
            </button>
          ))}
          {showAdd && (
            <>
              <div className="mx-3 my-1 border-t border-border" />
              <button
                type="button"
                onMouseDown={startAdd}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-brand-700 hover:bg-brand-50"
              >
                <span className="text-base font-bold">+</span>
                <span>Add &ldquo;{query.trim()}&rdquo; as a new city</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Country picker — slides in after "Add" is chosen */}
      {addMode && (
        <div className="mt-2 space-y-2">
          <select
            required
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className={inputClass}
            autoFocus
          >
            <option value="">Select country for {query.trim()}</option>
            {countryOptions.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!countryCode}
              onMouseDown={confirmAdd}
              className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-40"
            >
              Confirm
            </button>
            <button
              type="button"
              onMouseDown={() => { setAddMode(false); setOpen(true); }}
              className="rounded-lg border border-border px-4 py-2 text-sm text-neutral-500 hover:bg-slate-50"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

export function JoinForm({
  cityOptions,
  countryOptions,
}: {
  cityOptions: CityOption[];
  countryOptions: CountryOption[];
}) {
  const router = useRouter();

  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // City selection — now managed by combobox
  const [isCustomCity, setIsCustomCity]       = useState(false);
  const [city, setCity]                       = useState("");
  const [customCityName, setCustomCityName]   = useState("");
  const [countryCode, setCountryCode]         = useState("");
  const [customCountryName, setCustomCountryName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  function handleCountryChange(code: string) {
    setCountryCode(code);
    const found = countryOptions.find((c) => c.code === code);
    setCustomCountryName(found?.name ?? "");
  }
  void handleCountryChange; // used by combobox callback below

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: contactName.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          isCustomCity,
          city: isCustomCity ? "" : city,
          customCityName: isCustomCity ? customCityName.trim() : "",
          countryCode: isCustomCity ? countryCode : "",
          customCountryName: isCustomCity ? customCountryName : "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      const supabase = getAuthBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError("Account created. Sign in with your email and password.");
        return;
      }
      router.push("/app/setup");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label htmlFor="contactName" className="block text-sm font-medium text-neutral-700">
          Your name
        </label>
        <input
          id="contactName"
          type="text"
          required
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          placeholder="Your name"
          autoComplete="name"
          className={inputClass}
        />
      </div>

      {/* City */}
      <div>
        <label className="block text-sm font-medium text-neutral-700">City</label>
        <CityCombobox
          cityOptions={cityOptions}
          countryOptions={countryOptions}
          onSelect={({ isCustom, citySlug, customCityName: cn, countryCode: cc, countryName }) => {
            setIsCustomCity(isCustom);
            setCity(citySlug);
            setCustomCityName(cn);
            setCountryCode(cc);
            setCustomCountryName(countryName);
          }}
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourrental.com"
          autoComplete="email"
          className={inputClass}
        />
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-neutral-700">
          Phone
        </label>
        <input
          id="phone"
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+371 20 000 000"
          autoComplete="tel"
          className={inputClass}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-brand-700 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:opacity-60"
      >
        {loading ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-xs text-neutral-400">
        Already registered?{" "}
        <a href="/app/login" className="text-brand-700 underline-offset-2 hover:underline">
          Sign in
        </a>
      </p>
    </form>
  );
}
