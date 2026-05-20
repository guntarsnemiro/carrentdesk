"use client";

import { useState, useEffect, useRef } from "react";

/**
 * A text input that always shows DD/MM/YYYY regardless of browser locale.
 * Internally stores and receives values as YYYY-MM-DD (HTML date format).
 * Also accepts dot-separated input (DD.MM.YYYY) and auto-inserts slashes.
 * Includes a calendar icon button that opens the native date picker.
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
  const hiddenRef = useRef<HTMLInputElement>(null);

  // Sync when parent changes value externally
  useEffect(() => {
    setText(isoToDisplay(value));
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value;
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
    if (e.key === "Backspace" || e.key === "Delete") return;
    const v = (e.target as HTMLInputElement).value;
    if (v.length === 2 && !v.includes("/") && !v.includes(".")) {
      setText(v + "/");
    }
    if (v.length === 5 && v[2] === "/" && !v.slice(3).includes("/")) {
      setText(v + "/");
    }
  }

  function handleBlur() {
    if (value) setText(isoToDisplay(value));
  }

  function handlePickerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const iso = e.target.value; // already YYYY-MM-DD
    if (iso) {
      onChange(iso);
      setText(isoToDisplay(iso));
    }
  }

  function openPicker() {
    try {
      hiddenRef.current?.showPicker();
    } catch {
      hiddenRef.current?.click();
    }
  }

  return (
    <div className="relative flex items-center">
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
        className={`${className ?? ""} pr-8`}
      />
      {/* Hidden native date picker — used only for the calendar popup */}
      <input
        ref={hiddenRef}
        type="date"
        value={value}
        onChange={handlePickerChange}
        tabIndex={-1}
        aria-hidden
        className="absolute right-0 w-0 opacity-0 pointer-events-none"
        style={{ height: 0, padding: 0, border: 0 }}
      />
      {/* Calendar icon button */}
      <button
        type="button"
        onClick={openPicker}
        tabIndex={-1}
        className="absolute right-2 flex items-center justify-center text-neutral-400 hover:text-brand-600 transition-colors"
        title="Open date picker"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>
    </div>
  );
}
