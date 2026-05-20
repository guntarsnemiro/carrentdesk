"use client";

import { useState, useEffect } from "react";

/**
 * A text input that always shows DD/MM/YYYY regardless of browser locale.
 * Internally stores and receives values as YYYY-MM-DD (HTML date format).
 * Also accepts dot-separated input (DD.MM.YYYY) and auto-inserts slashes.
 *
 * The calendar icon overlays an invisible <input type="date"> so that clicking
 * it physically clicks the native picker — this is the only cross-browser
 * reliable way to open it (showPicker() is blocked in many browsers).
 */

function isoToDisplay(iso: string): string {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

function displayToIso(display: string): string {
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
    const iso = e.target.value;
    if (iso) {
      onChange(iso);
      setText(isoToDisplay(iso));
    }
  }

  return (
    <div className="relative flex items-center">
      {/* Visible text input — always DD/MM/YYYY */}
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

      {/* Calendar icon + invisible native date input stacked on top of it.
          Clicking the icon area physically clicks the date input → picker opens
          in every browser without needing showPicker(). */}
      <span className="absolute right-0 flex h-full w-8 cursor-pointer items-center justify-center">
        {/* Icon (pointer-events-none so clicks pass through to the input below) */}
        <svg
          width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          className="pointer-events-none text-neutral-400"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        {/* Invisible date input covers the icon area exactly */}
        <input
          type="date"
          value={value}
          onChange={handlePickerChange}
          tabIndex={-1}
          className="absolute inset-0 cursor-pointer opacity-0"
          style={{ colorScheme: "light" }}
        />
      </span>
    </div>
  );
}
