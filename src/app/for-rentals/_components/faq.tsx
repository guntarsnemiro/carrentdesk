type Item = {
  q: string;
  a: string;
};

const ITEMS: Item[] = [
  {
    q: "How much does CarRentDesk cost?",
    a: "One simple plan priced by fleet size, with every feature included: Starter (up to 10 vehicles) €29/month, Growth (11–25 vehicles) €49/month, and Pro (26–40 vehicles) €90/month. Larger fleets get custom pricing. Pay yearly and get two months free. Start with a free trial — no credit card required.",
  },
  {
    q: "Do you take a commission on bookings?",
    a: "No. Ever. CarRentDesk is direct-contact only — phone, WhatsApp, email. We never see your customer's payment, and we don't insert ourselves between you and the renter. Your customer relationship stays yours.",
  },
  {
    q: "What if I want to leave?",
    a: "Full data export in CSV + PDF. We don't hold your data hostage. Cancel anytime. The principle: if our software stops being worth what you pay, you should leave — without paying us a cent more.",
  },
  {
    q: "Where is my data hosted? Is it GDPR-compliant?",
    a: "EU-only infrastructure (Frankfurt and Ireland regions). Postgres on Supabase with row-level security per company. Full GDPR compliance: audit logs, configurable retention, and the right to export and delete every piece of data you put into the system.",
  },
  {
    q: "Do customers book through CarRentDesk?",
    a: "No. The marketplace is a discovery surface, not a booking platform. Customers find your listing, then call, WhatsApp, or email you directly. Booking, pricing, deposits, and the rental agreement all stay in your system — not ours.",
  },
  {
    q: "How is this different from existing rental software?",
    a: "Two ways. First, we cover both sides — operations and visibility — in one platform, instead of you stitching together a booking tool, a marketplace listing, and a fleet spreadsheet. Second, we're built by a rental owner with fifteen years of operating experience in the Baltics, not by an outside team trying to disrupt rentals from afar.",
  },
  {
    q: "What if my staff isn't tech-savvy?",
    a: "The platform is designed for the parking lot, not the office. Phone-first, with simple, clear screens for the daily flows your staff actually uses. We train your team during onboarding, and direct WhatsApp support is included. If a feature is too complex, that's a bug we fix — not your problem.",
  },
  {
    q: "What's the catch?",
    a: "There isn't one. Pricing is simple and transparent — a flat monthly fee based on your fleet size, with every feature included and no commission on bookings. Cancel anytime and export your data. We have to earn your subscription every month.",
  },
];

export function FAQ() {
  return (
    <div className="divide-y divide-border rounded-2xl bg-background ring-1 ring-border">
      {ITEMS.map((item) => (
        <details key={item.q} className="group px-5 py-4 sm:px-6">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6">
            <span className="text-base font-semibold text-brand-950">
              {item.q}
            </span>
            <span
              aria-hidden
              className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-surface-soft text-brand-900 transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-700">
            {item.a}
          </p>
        </details>
      ))}
    </div>
  );
}
