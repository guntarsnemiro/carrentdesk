"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";

type CityOption = { slug: string; name: string; country: string };
type CountryOption = { code: string; name: string };

const inputClass =
  "mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500";

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

  // City selection
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [city, setCity] = useState("");                      // known city slug
  const [customCityName, setCustomCityName] = useState(""); // new city text
  const [countryCode, setCountryCode] = useState("");        // country code
  const [customCountryName, setCustomCountryName] = useState(""); // country display name

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleCountryChange(code: string) {
    setCountryCode(code);
    const found = countryOptions.find((c) => c.code === code);
    setCustomCountryName(found?.name ?? "");
  }

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

        {!isCustomCity ? (
          <>
            <select
              required={!isCustomCity}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={inputClass}
            >
              <option value="">Select your city</option>
              {cityOptions.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}, {c.country}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => { setIsCustomCity(true); setCity(""); }}
              className="mt-1.5 text-xs text-brand-700 hover:underline"
            >
              My city isn&apos;t listed →
            </button>
          </>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              required
              value={customCityName}
              onChange={(e) => setCustomCityName(e.target.value)}
              placeholder="e.g. London"
              autoComplete="off"
              className={inputClass}
            />
            <select
              required
              value={countryCode}
              onChange={(e) => handleCountryChange(e.target.value)}
              className={inputClass}
            >
              <option value="">Select country</option>
              {countryOptions.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => { setIsCustomCity(false); setCustomCityName(""); setCountryCode(""); }}
              className="text-xs text-neutral-500 hover:underline"
            >
              ← Back to city list
            </button>
          </div>
        )}
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
