/** Client-safe constants for the global blacklist — no server imports. */

export const REASON_LABELS: Record<string, string> = {
  property_damage: "Property damage",
  theft:           "Theft",
  fraud:           "Fraud / false identity",
  non_payment:     "Non-payment",
  violence:        "Violence / threatening behaviour",
  other:           "Other",
};

export const SEVERITY_LABELS: Record<number, { label: string; cls: string }> = {
  1: { label: "Minor",    cls: "bg-yellow-50 text-yellow-700" },
  2: { label: "Serious",  cls: "bg-orange-50 text-orange-700" },
  3: { label: "Critical", cls: "bg-red-50 text-red-700"       },
};
