# Lovable demo prompt — CarRentDesk (marketplace + operations)

Copy everything inside the **fenced block** below into Lovable as your project prompt. Adjust copy or fake data if you want.

---

```
You are building a **static demo prototype** (no real backend, no real auth, no API keys) for **CarRentDesk** — a Baltic-focused product with two sides:

1) **Marketplace (customer-facing)** — discovery only: find local car rentals, filter, open company profiles, contact via phone / WhatsApp / email / website. NO booking, NO payments, NO customer accounts, NO “claim listing” on public pages.

2) **Operations (rental-owner demo)** — a **full operator app shell** that mirrors every major section in the product spec (Demand & revenue, Fleet, Customers, Inspections, Automation, Finance, Growth, Compliance, Locations). Most screens are **rich UI placeholders** with realistic labels, fake tables, charts as simple CSS/SVG, and disabled or toast-only actions so the product feels **finished and deep** even when nothing persists. Only **Inspections → New inspection** needs real interactivity (photos, pins, print view) as the MVP wedge demo.

**Brand / UI**
- Clean, professional, Stripe-like: white/near-white background, charcoal text (#0F172A), one accent blue (#2563EB), subtle borders, generous spacing.
- Mobile-first layouts; marketplace must look great on phone width.
- Use a distinctive but readable font from Google Fonts (NOT Inter/Roboto): e.g. **“DM Sans”** for UI and **“Fraunces”** or **“Instrument Serif”** for headings — pick one pairing and stick to it.
- Top bar: logo text “CarRentDesk” + nav: Marketplace | For rentals (B2B landing) | **Operator** → `/operator` (opens the full ops shell; still show the global demo banner).

**Global demo rules**
- Show a small dismissible banner: “Demo prototype — data is fake, no logins.”
- All data in-memory or hardcoded JSON in the repo; refreshing the page can reset state.
- No environment variables. No Supabase. No payments.

**Marketplace pages to implement**

1. **Home `/`**
   - Headline: local rentals across **Riga, Tallinn, Vilnius** (English copy).
   - Three city cards with counts (use fake numbers, e.g. “Riga · 22 rentals”).
   - Short “how it works”: Find → Contact rental directly → Drive.
   - Footer link “For rental owners” → `/for-rentals`.

2. **City page `/riga` (and `/tallinn`, `/vilnius`)**
   - Title + one line of SEO-ish copy.
   - **Filters** (client-side only): chips or dropdowns for: airport pickup, English-speaking staff, 24/7, long-term discounts, winter tires, cross-border OK. Also filter by **fleet size band**: 1–5, 6–20, 21+.
   - **Company cards** (no photos for “unclaimed” style rows — use initials avatar + clean layout; for 1–2 “claimed” examples show a small photo strip).
   - Each card shows: name, city, **fleet summary line** (e.g. “Mostly 2016–2020 automatics, diesel/petrol”), **services icons**, **Verified** badge ONLY on companies flagged `verified: true` (2 fake verified, rest unclaimed).
   - Primary CTA on card: **Call** and **WhatsApp** (use `tel:` and `https://wa.me/371XXXXXXXX` with fake numbers formatted realistically).

3. **Company profile `/c/[slug]`**
   - Hero: name, city, verified badge if applicable.
   - Sections: About (short), Address + static map placeholder (styled box, not a real map API), **Fleet summary** (text, not per-vehicle list for unclaimed), **Services** checklist, **Contact** big buttons: Call, WhatsApp, Email (`mailto:`), Website (external `#` or example.com).
   - NO “claim this listing” anywhere on this public page.

4. **For rentals `/for-rentals`**
   - B2B copy: two failure modes in plain English (years 1–3 growth vs years 5–8 overload), then CarRentDesk = marketplace + ops, starting with inspections.
   - CTA button “Open operator app (demo)” → `/operator`.

**Operations app shell `/operator` (no login — “fake SaaS”)**

Use a **persistent layout**: left **sidebar** (collapsible on mobile into a drawer) + **main content** + optional **right panel** for detail drawers. Company context: top bar inside ops area shows a **company switcher** (BalticCarRent, BusRent, EcoRent — fake) that only changes labels/numbers in the UI, no real persistence.

Add a tiny **“Demo preview”** pill or section subtitle on non-interactive pages: *UI preview — not connected to backend*.

**Sidebar structure (must match these 9 product areas from the ops spec — names can shorten for nav labels)**

1. **Dashboard** → `/operator`
2. **Demand & revenue** → `/operator/demand`
3. **Fleet** → `/operator/fleet`
4. **Customers** → `/operator/customers`
5. **Inspections** → `/operator/inspections` (+ new flow below)
6. **Automation** → `/operator/automation`
7. **Finance** → `/operator/finance`
8. **Growth** → `/operator/growth`
9. **Compliance** → `/operator/compliance`
10. **Locations** → `/operator/locations`
11. **Settings** (footer of sidebar) → `/operator/settings` — company profile, “Team invites (roadmap)” greyed.

---

**1) Dashboard `/operator`**

- Row of **KPI cards** (fake numbers): Active rentals, Fleet utilization %, Revenue MTD (€), Open tasks, Overdue returns (badge), New marketplace clicks (7d).
- **Rental workflow pipeline** widget: horizontal steps (Booking → Customer → Vehicle → Pickup inspection → Active → Return inspection → Close + invoice). One fake rental “in progress” with step 4 highlighted; others greyed.
- **Recent activity** feed (8–12 fake rows): “Pickup inspection completed — AB-1234”, “Maintenance due — CD-5678”, etc.
- **Alerts strip**: overdue return, maintenance due tomorrow, low fleet availability — each row has “View” → scrolls to relevant section or shows toast “Demo”.

---

**2) Demand & revenue `/operator/demand`**

Use **sub-tabs** or anchor sections on one long page:

- **Bookings & calendar**: week view grid (CSS), 5–8 fake booking blocks (customer initials, vehicle plate, status). Buttons: “New booking”, “Modify” — open modal with form fields (dates, vehicle, customer) — **Submit only shows toast** “Saved in demo (not persisted)”.
- **Quotes**: small table (Quote ID, customer, vehicle class, total €, status). Button “New quote” → modal → toast.
- **Pricing**: table of vehicles with columns: Daily €, Weekend rule, Long-term discount %, Last edited. Row actions “Edit” → side drawer with sliders/toggles (fake). Show a **“Seasonal rules”** subsection with 2 fake rules (e.g. “Jun–Aug +12%”).
- **Channels**: card “Marketplace sync: On (demo)”, “Prevent double-bookings: Planned”, disabled toggle “Connect Booking.com” with “Roadmap”.

---

**3) Fleet `/operator/fleet`**

- **Vehicle database** table: Plate, Make/Model/Year, VIN (masked), Status (available / rented / maintenance / damaged / retired), Location, Daily rate.
- Row click → **drawer** with tabs: Overview | Photos (placeholders) | Documents (list: registration, insurance, CSDD — fake “View” opens empty modal) | History (fake timeline).
- **Utilization** column: small horizontal bar + % (fake).
- **Maintenance** column: “Next service in 1,200 km” or date (fake).
- Top actions: “Add vehicle”, “Bulk pricing” — toast “Demo”.

---

**4) Customers `/operator/customers`**

- Table: Name, Phone, Email, Rentals count, Last rental, **Risk** (Low/Med/High pill — fake).
- Row click → **profile**: rental history list (3 fake rows), **Notes** textarea (local state ok), **Documents** subsection (license/agreement — upload disabled “Demo”), **Communication** timeline (fake WhatsApp/email/call entries).
- **Segmentation** (later) subsection: chips “Frequent”, “Corporate”, “High risk” — filter UI only, fake counts.

---

**5) Inspections `/operator/inspections` (only fully interactive module)**

- **List view**: table of past inspections (5–8 fake rows): date, vehicle, type Pickup/Return, inspector, damage count, status Locked. Row click → read-only detail modal (fake data).
- Button **“New inspection”** → `/operator/inspections/new` (or slide-over wizard):

**New inspection wizard (interactive)**

- **Step A**: Pick vehicle from fleet (dropdown populated from same fake fleet as Fleet page).
- **Step B**: Type = Pickup | Return (radio).
- **Step C**: Photo upload 3–6 slots (file picker + object URL previews).
- **Step D**: **Silhouette** — SVG car outline; click to place numbered pins; pin editor: note + severity (minor/moderate/severe). Optional second tab “Compare” showing two placeholder images “Pickup vs Return” with label “Side-by-side (demo)”.
- **Step E**: Optional fields: repair estimate € per pin (number inputs, local only), “New vs existing” toggle per pin (UI only).
- **Submit** → success: “Inspection locked (demo)” + timestamp.
- **“View / print report”** → modal, **A4-width**, print-friendly: header, vehicle, photos grid, damage table, audit line “Immutable record (demo)”, signatures. Browser print OK.

---

**6) Automation `/operator/automation`**

- **Workflow engine**: same 7-step pipeline as dashboard but full width; drag-drop **not** required — show “Example rental #1042” moving through steps with “Mark complete” buttons → toast.
- **Tasks**: Kanban or table — columns Assigned / In progress / Done; 6 fake tasks (clean car, deliver, inspect, refuel). Checkbox completes locally until refresh.
- **Notifications**: list with icons — overdue return, upcoming booking, maintenance due, new damage on inspection — timestamps fake.

---

**7) Finance `/operator/finance`**

- **Date range** picker (UI only).
- **Revenue**: simple bar chart (CSS) — last 7 days fake €.
- **Costs** breakdown: Maintenance, Cleaning, Damage, Other — fake € amounts + horizontal bars.
- **Profit dashboard**: table “Net profit per vehicle” ranked best→worst (fake €); highlight worst row; small text “Idle capital risk” on one vehicle.
- Buttons “Export CSV”, “Connect accounting” — disabled, “Roadmap”.

---

**8) Growth `/operator/growth`**

- **Marketplace integration**: cards — Profile views (7d), Contact clicks (7d), **Visibility score** vs 3 fake competitors (progress bars).
- **Lead inbox**: 2 fake leads (source: Marketplace / Direct), status dropdown, “Convert to booking” → toast.
- **Conversion tools**: card “Fast quote” with prefilled fake inquiry; button “Send offer” → toast.

---

**9) Compliance `/operator/compliance`**

- Grid of **document types**: Driver license, Rental agreement, Insurance, CSDD/TA — each card: status (Valid / Expires soon), expiry date, “Upload” disabled with “Demo”.
- **Risk scoring** subsection: 2 fake customer rows with “Damage likelihood”, “Late return” meters (CSS) and “Blacklist” toggle (local UI, toast).

---

**10) Locations `/operator/locations`**

- Cards for **branches**: “Riga HQ”, “RIX desk” with address, hours, phone.
- **Fleet split** fake numbers per branch.
- Button “Transfer vehicle between branches” → modal → toast “Demo”.
- Static map placeholder (styled rectangle).

---

**11) Settings `/operator/settings`**

- Company legal name, VAT (fake), default currency EUR, language EN.
- “Team & roles” — greyed list “Owner (you)” + “Invite staff — roadmap”.

---

**Cross-cutting polish for ops area**

- Breadcrumb: `Operator / [Section] / [Subtab if any]`.
- Search box in sidebar footer (filters nav items only, client-side).
- Consistent **primary button** style; destructive actions only as outline.
- Empty states where relevant should still look designed (illustration optional: simple geometric shape OK).

---

**Minimal interaction contract (so Lovable doesn’t overbuild)**

- **Must work without backend**: company switcher (local state), inspection wizard (local state + print), task checkboxes (local until refresh), modals that toast on submit.
- **Everything else**: visually complete, fake data, buttons either disabled with “Demo / roadmap” or toast “Not persisted in demo”.

**Fake seed data (use exactly these slugs and mix)**

- `balticcarrent` — Riga, verified: true, claimed style with photos, services: airport pickup, English, 24/7, winter tires.
- `busrent` — Riga, verified: true, similar.
- `ecorent` — Riga, verified: false, claimed: true, no hero photo (placeholder).
- Plus ~6 more Riga companies (unclaimed), varied services.
- Repeat smaller sets for Tallinn and Vilnius so each city page feels populated (can duplicate pattern with different names).
- Reuse the **same fake fleet vehicles** (plates, make/model) in **Fleet**, **Bookings**, **Inspections**, and **Finance** tables so the demo feels like one coherent product.

**Quality bar**
- Polished empty states, hover states, and focus rings.
- No lorem ipsum in customer-facing headlines; use realistic rental copy.
- Keep bundle light; no heavy chart libraries unless needed.

Deliver as a **single cohesive demo** with internal navigation between all sections. Name the app CarRentDesk in the HTML title and README line.
```

---

## If Lovable hits a length limit

Paste in **two messages**: (1) from the opening through the end of **Marketplace pages** (include **Global demo rules** and **Brand / UI**). (2) paste **Operations app shell** through the final **Deliver** line (include **Fake seed data** and **Quality bar**).

---

## After Lovable generates

- Replace fake phone numbers with **371**-style placeholders you control, or leave clearly fake.
- Export / share the Lovable URL for Anna and design partners.
- For the real June 12 video, you’ll re-record on **production** — this Lovable build is **story + UX only**.
