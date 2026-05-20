"use client";

import { useState, useEffect } from "react";

/**
 * A text input that always shows DD/MM/YYYY regardless of browser locale.
 * Internally stores and receives values as YYYY-MM-DD (HTML date format).
 * Also accepts dot-separated input (DD.MM.YYYY) and auto-inserts slashes.
 */

function isoToDisplay(iso: string): string {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

function displayToIso(display: string): string {
  // Accept DD/MM/YYYY or DD.MM.YYYY
  const clean = display.replace(/\./g, "/").trim();
  const parts = clean.split("/");
  if (parts.length !== 3) return "";
  const [d, m, y] = parts;
  if (!d || !m || !y || y.length !== 4) return "";
  const padded = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  const dt = new Date(padded);
  if (isNaN(dt.getTime())) return "";
  return padded;
}

interface DateInputProps {
  value: string;           // YYYY-MM-DD (or empty)
  onChange: (iso: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export function DateInput({ value, onChange, required, className, placeholder = "DD/MM/YYYY" }: DateInputProps) {
  const [text, setText] = useState(() => isoToDisplay(value));

  // Sync when parent changes value externally
  useEffect(() => {
    setText(isoToDisplay(value));
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value;
    // Strip anything that's not digit or separator
    v = v.replace(/[^0-9./]/g, "");
    setText(v);
    const iso = displayToIso(v);
    if (iso) {
      onChange(iso);
    } else if (!v) {
      onChange("");
    }
  }

  function handleKeyUp(e: React.KeyboardEvent<HTMLInputElement>) {
    // Auto-insert slash after DD and after MM while user types digits
    if (e.key === "Backspace" || e.key === "Delete") return;
    const v = (e.target as HTMLInputElement).value;
    // After 2 digits (day), add /
    if (v.length === 2 && !v.includes("/") && !v.includes(".")) {
      setText(v + "/");
    }
    // After DD/MM (5 chars), add /
    if (v.length === 5 && v[2] === "/" && !v.slice(3).includes("/")) {
      setText(v + "/");
    }
  }

  function handleBlur() {
    // On blur, normalize to DD/MM/YYYY if valid
    if (value) {
      setText(isoToDisplay(value));
    }
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={text}
      onChange={handleChange}
      onKeyUp={handleKeyUp}
      onBlur={handleBlur}
      placeholder={placeholder}
      required={required}
      maxLength={10}
      className={className}
    />
  );
}
