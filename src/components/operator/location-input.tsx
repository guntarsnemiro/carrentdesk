"use client";

interface Props {
  value: string;
  onChange: (v: string) => void;
  presets: string[];
  placeholder?: string;
  name?: string;
  className?: string;
}

export function LocationInput({ value, onChange, presets, placeholder, name, className }: Props) {
  if (presets.length === 0) {
    return (
      <input
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "e.g. Airport Terminal 1"}
        className={className}
      />
    );
  }

  return (
    <div className="space-y-1.5">
      {/* Preset pills */}
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors
              ${value === p
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-border bg-slate-50 text-neutral-600 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
              }`}
          >
            {p}
          </button>
        ))}
        {value && !presets.includes(value) && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-500 hover:bg-neutral-200"
          >
            ✕ clear
          </button>
        )}
      </div>
      {/* Free-text input */}
      <input
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Or type a custom location…"}
        className={className}
      />
    </div>
  );
}
