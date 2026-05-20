"use client";

import { useState, useEffect, useRef, useId } from "react";

/**
 * Text input always showing DD/MM/YYYY. Internally YYYY-MM-DD.
 * Calendar icon opens the native date picker via showPicker() —
 * called from a real user click, which satisfies Chrome's security check.
 * The hidden <input type="date"> uses clip-path: inset(50%) to be invisible
 * without opacity-0 (which still bleeds the MM/DD editing fields in Chrome).
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
  value: string;
  onChange: (iso: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export function DateInput({
  value,
  onChange,
  required,
  className,
  placeholder = "DD/MM/YYYY",
}: DateInputProps) {
  const [text, setText] = useState(() => isoToDisplay(value));
  const pickerRef = useRef<HTMLInputElement>(null);
  const uid = useId();

  useEffect(() => {
    setText(isoToDisplay(value));
  }, [value]);

  function handleTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/[^0-9./]/g, "");
    setText(v);
    const iso = displayToIso(v);
    if (iso) onChange(iso);
    else if (!v) onChange("");
  }

  function handleKeyUp(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" || e.key === "Delete") return;
    const v = (e.target as HTMLInputElement).value;
    if (v.length === 2 && !v.includes("/") && !v.includes(".")) setText(v + "/");
    if (v.length === 5 && v[2] === "/" && !v.slice(3).includes("/")) setText(v + "/");
  }

  function handleBlur() {
    if (value) setText(isoToDisplay(value));
  }

  function handlePickerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const iso = e.target.value; // always YYYY-MM-DD from <input type="date">
    if (iso) {
      onChange(iso);
      setText(isoToDisplay(iso));
    }
  }

  function openPicker() {
    // showPicker() is allowed from a direct user-gesture click (Chrome 99+, Firefox 101+, Safari 16+)
    try {
      pickerRef.current?.showPicker();
    } catch {
      // Fallback for older browsers — programmatic click on the input
      pickerRef.current?.focus();
    }
  }

  return (
    <div className="relative flex items-center">
      {/* Visible text input — always DD/MM/YYYY */}
      <input
        id={uid}
        type="text"
        inputMode="numeric"
        value={text}
        onChange={handleTextChange}
        onKeyUp={handleKeyUp}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        maxLength={10}
        className={`${className ?? ""} pr-8`}
      />

      {/* Native date picker — clipped to invisible but has real dimensions
          so showPicker() works. clip-path hides it without exposing the
          MM/DD editing spinners that opacity-0 still shows when focused. */}
      <input
        ref={pickerRef}
        type="date"
        value={value}
        onChange={handlePickerChange}
        tabIndex={-1}
        aria-hidden
        style={{
          position: "absolute",
          right: 8,
          top: "50%",
          transform: "translateY(-50%)",
          width: 28,
          height: 28,
          padding: 0,
          border: 0,
          clipPath: "inset(50%)",
          pointerEvents: "none",
        }}
      />

      {/* Calendar icon button — triggers showPicker() on real user click */}
      <button
        type="button"
        onClick={openPicker}
        tabIndex={-1}
        title="Pick date"
        className="absolute right-2 flex items-center justify-center text-neutral-400 hover:text-brand-700 transition-colors"
      >
        <svg
          width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>
    </div>
  );
}
