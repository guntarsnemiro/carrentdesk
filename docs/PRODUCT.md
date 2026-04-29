# CarRentDesk — Product & Business Specification

> Strategic reference document. Describes **what** we are building and **why**.
> For the **full marketplace feature universe**, see [`MARKETPLACE.md`](./MARKETPLACE.md).
> For the **full operations feature universe**, see [`OPERATIONS.md`](./OPERATIONS.md).
> For **how** and **when**, see [`ROADMAP.md`](./ROADMAP.md).

---

## 1. Vision

A **hybrid platform for local car rental companies** combining:

1. A **local marketplace directory** (customer-facing listings)
2. A **rental operations system** (business-facing SaaS)
3. A **network effect layer** that increases visibility of small rental companies and helps them compete with large international brands (e.g. Sixt, Hertz)

Core thesis:

> Use the marketplace as a growth engine and sales hook, and the operations system as the retention layer that makes switching away difficult.

---

## 2. Core Problem

Local car rental companies fail in two predictable ways. Both are about distribution and operations, never about cars themselves.

### Failure mode A — they die in years 1-3

Cause: **not enough growth.** New rentals struggle to be found. Big chains (Sixt, Hertz, Avis, Booking) own the airport traffic, the Google search results, and the brand recognition. A new local rental has 5 cars and no way to fill them. They burn through founder savings and close before reaching critical scale.

What they need: **distribution.** Visibility. A way to be discovered by customers without paying €15-30 in Google Ads per click.

### Failure mode B — they quit in years 5-8

Cause: **owner overload.** A rental that survives early stage runs on personal energy: WhatsApp messages, Excel sheets, paper forms, manual everything. By year 5, the owner is operating their business 7 days a week and has no leverage to grow further. They sell, downsize, or burn out.

What they need: **operations leverage.** A system that handles bookings, customer records, fleet status, and especially damage disputes — so the owner can manage outcomes instead of doing every task by hand.

### The strategic insight

> Most rental SaaS solves Failure B. Most marketplaces solve Failure A. Nobody solves both. We do.

The same rental company is a marketplace customer in years 1-3 (free hook) and an ops-platform customer in years 5-8 (paid moat). They never leave the platform — they grow into the second product.

Both failures share secondary symptoms:

- Fragmented tools (Excel + WhatsApp + paper forms)
- No unified digital presence
- Lost disputes over vehicle damage with no photographic history
- "Working" manual processes that make switching software hard

**Tactical insight:** operational improvement alone is hard to sell. Visibility, leads, and dispute-proof inspections are easy to understand and highly valuable. We sell the easy thing first (visibility / inspections), then the hard thing follows (full ops platform).

---

## 3. Product Structure

### 3.1 Marketplace (Customer-facing layer)

A public **listing directory** of local car rental companies and their vehicles. Customers discover, then contact the rental directly.

**Purpose**

- Help customers find local rental providers
- Generate organic traffic and SEO footprint
- Create visibility competition among rental companies
- Act as proof of traction for B2B sales
- Feed visibility data back to operators (proof of ROI)

**Vision (long-term)**

The marketplace evolves into the default discovery network for local rentals across multiple countries, with deep SEO authority, editorial content, multi-language support, and rich filtering. Twelve functional areas span discovery, listings, profiles, trust, contact handoff, SEO, content, network effects, and visibility data.

The full functional breakdown lives in [`MARKETPLACE.md`](./MARKETPLACE.md). That document is the **feature universe**. This section defines only what we commit to deliver and when.

**Firm boundary (never)**

The marketplace is a **discovery surface**, not a transaction platform.

- ❌ Online booking engine
- ❌ Online payments / deposits
- ❌ Customer document upload (driver license, ID)
- ❌ KYC / identity verification
- ❌ Acting as the rental contract counterparty

This keeps us out of payments, KYC, insurance liability, and customer PII permanently — not just at MVP.

**Listing lifecycle (status model)**

Every company in the marketplace has one of three statuses, but the customer never sees the status — to a customer, all listings look the same.

| Status | How it gets there | What's shown publicly | Customer sees claim CTA? |
|---|---|---|---|
| `unclaimed` | Manually entered by us during launch (from public business directories / Google Maps) | Company-level info only (no photos, no per-vehicle pages) | **No.** Listing looks normal. |
| `claimed` | Operator claimed via outreach link or `/for-rentals` lookup | Operator-edited copy, operator-uploaded photos, full fleet description | No |
| `verified` | Claimed AND uses the operations platform (e.g. completed at least one inspection) | Verified badge, higher search ranking, per-vehicle pages | No |

**Claim discovery (operator-facing only)**

Customers never see claim prompts. Operators reach the claim flow via:

1. **Direct outreach** — we send a personalized magic link via email/WhatsApp/phone. Primary path.
2. **B2B landing page** — `/for-rentals` has a "Find your business" search.
3. **Operator subdomain** — `app.carrentdesk.com` → first-visit business search.
4. **Subtle footer link** — "For rental owners" in the global footer.

This keeps the public marketplace clean and avoids signalling "scraped" to customers.

**Listing data (MVP)**

For unclaimed and claimed company listings (no per-vehicle pages until verified):

- Company name, city, address
- Phone, email, website
- Short description
- Fleet count (e.g. "8 vehicles")
- Fleet description (e.g. "5–10 year automatics, mostly diesel")
- Services / amenities (airport delivery, city delivery, long-term rental, cross-border, English-speaking staff, 24/7, child seats, winter tires)
- Photos (claimed only — operator-uploaded)

**MVP scope (Phase 0–1)**

- List of rental companies, browsable by city (Riga, Tallinn, Vilnius)
- Filtering: city, services/amenities, fleet description keywords
- Company profile pages (info above)
- Direct-contact CTAs: phone, email, WhatsApp, website
- Anonymous contact-click tracking surfaced to operators
- SEO baseline: per-city pages, structured data, sitemap, OG tags
- Operator claim flow (hidden from customers)

**Deferred to later phases** (still in scope, just not at launch — see MARKETPLACE.md)

- Per-vehicle listings (unlocks for verified operators only)
- Vehicle-level filtering (transmission, seats, type, price)
- Map view, saved searches, customer-side comparison
- Reviews & ratings (need traffic volume first)
- Editorial content / city guides
- Multi-language UI, multi-currency
- Inquiry/quote forms (require operator inbox in ops)
- Featured / paid placement (monetization)
- Cross-rental availability sharing

---

### 3.2 Operations System (B2B SaaS layer)

Internal tool used by rental companies. Authenticated, multi-tenant.

**Vision (long-term)**

Transform the rental owner from an **operator** (handling daily tasks manually) into a **business owner** (managing outcomes via a dashboard). The full operations platform spans nine functional areas:

1. Demand & revenue generation (bookings, pricing, channels)
2. Fleet management (vehicle DB, utilization, maintenance)
3. Customer management (CRM-light, communication history, segmentation)
4. **Inspection & damage control** ← MVP wedge
5. Operations automation (workflow engine, tasks, alerts)
6. Financial control (revenue, costs, profit dashboard)
7. Sales & growth (lead inbox, conversion tools)
8. Trust, compliance & risk (operator-side document storage, risk scoring)
9. Multi-location & scaling support

The full functional breakdown lives in [`OPERATIONS.md`](./OPERATIONS.md). That document is the **feature universe**. This section defines only what we commit to deliver and when.

**Customer data note**

The operations platform is the rental company's **internal** business system. It will eventually store customer profiles, license images, rental agreements, and other operator-owned records that the rental company needs to run their business. This is distinct from the public marketplace, which never collects or stores customer documents (see §3.1).

**MVP focus: Inspection tool (the moat wedge)**

For the first version we deliberately ship one operations module: vehicle inspection. It is daily-use, replaces a real pain (WhatsApp / paper-based damage disputes), and accumulates data that makes future churn painful.

- Capture photos of a vehicle at pickup and return
- Mark damages on a vehicle silhouette (front / back / sides)
- Add notes and severity per damage
- Compare before/after side by side
- Store full inspection history per vehicle (immutable timeline)
- Export an inspection summary as PDF (rental company can email/print for the customer)

Plus the supporting baseline:

- Vehicle / fleet management (also powers marketplace listings)
- Company profile management (what shows on the public listing page)
- Multiple staff users per company
- Operator authentication

**Explicitly NOT in the MVP** (deferred to later phases per ROADMAP.md)

- ❌ Booking engine / availability calendar
- ❌ Customer database / CRM
- ❌ Pricing rules engine
- ❌ Payments / invoicing / deposits
- ❌ Damage cost calculation / insurance claims
- ❌ Customer document storage (added later as part of operator CRM)
- ❌ Maintenance scheduling
- ❌ Financial dashboards
- ❌ Multi-location support
- ❌ Native mobile app (PWA only)

These features are **on the long-term roadmap** (see OPERATIONS.md), they are simply not in the first release.

---

### 3.3 Network Layer (strategic effect)

Not a separate feature — the **combination effect** of marketplace + operations:

- More listed companies → more customer traffic → more value for rentals
- More rentals onboarded → richer marketplace inventory → better customer experience
- More inspection history accumulated → higher switching cost
- Brand becomes the "default" registry for local rentals in each market

---

## 4. Go-To-Market Strategy

Primary acquisition is **outbound, not inbound** — at least at MVP.

**Sales motion**

1. Manually add 30–50 rental companies to the marketplace per launch city (free listing, no signup required)
2. Reach out: calls, emails, in-person visits, Zoom demos
3. Lead with visibility ("you are already listed and getting views")
4. Demo the inspection tool as the daily-use hook
5. Convert to paid SaaS over time

**Pricing transition (when ready)**

- All early operators get permanent discounted "founding" pricing
- New sign-ups (post-pricing-launch) go straight to paid
- This avoids alienating early supporters and creates urgency for new prospects

---

## 5. Key Product Insight

> Marketplace is the **hook**.
> Inspection tool is the **moat**.
> Together: marketplace gets them in, the operations system keeps them locked in.

---

## 6. MVP Scope (locked)

### Must-have

- ✅ Public marketplace homepage
- ✅ Per-city / per-location listing pages
- ✅ Company profile pages
- ✅ Vehicle listings with photos and basic filters
- ✅ Direct-contact links (phone / email / WhatsApp / website)
- ✅ Operator authentication (multi-user per company)
- ✅ Vehicle / fleet CRUD for operators
- ✅ Company profile editing for operators
- ✅ Inspection tool: photo upload, damage tagging on silhouette, history per vehicle, PDF export
- ✅ Admin panel for internal staff (manage companies, listings, claims)

### Not in MVP

- ❌ Booking engine
- ❌ Payments
- ❌ Customer accounts / customer document storage
- ❌ Advanced CRM / lead pipeline
- ❌ Self-serve company signup (manual at first; "Claim this listing" added later)
- ❌ Native mobile app
- ❌ Multi-language UI (single language at launch — see Roadmap)

---

## 7. Strategic Decisions (resolved)

| Question | Decision |
|---|---|
| Single domain vs separate? | **Single domain.** Marketplace on root, operator app on `app.` subdomain, admin on `admin.`. One brand, one SEO pool. |
| Homepage focus? | **Customer-first** marketplace homepage. Small "For rental companies →" link leads to a B2B landing page. |
| Onboarding model? | **Manual creation first.** "Claim this listing" added once we have ~50 listed companies per city. |
| Free → paid transition? | **Free for everyone at MVP.** When paid plans launch, early operators get permanent discounted tier. |
| Marketplace = booking platform? | **No.** Listing/discovery only. Direct contact between customer and rental. |
| Customer doc storage on marketplace? | **No.** Marketplace never collects customer PII or documents. |
| Customer doc storage in ops platform? | **Yes, eventually** — but operator-side only, not in MVP. The rental company stores their own customer records (licenses, agreements) in their tenant. |
| Operations platform scope? | **MVP = inspection tool only.** Full vision (9 areas) lives in OPERATIONS.md and ships in later phases. |
| Launch market? | **Baltic capitals: Riga, Tallinn, Vilnius.** All three live at launch; outbound effort focused on Riga first until ~40 listings, then shift focus. |
| Launch language? | **English only.** Native LV / EE / LT / RU added post-MVP (see ROADMAP Phase 5+). |
| Domain? | **carrentdesk.com** (registered). Subdomains: `app.` for operators, `admin.` for internal. |
| Verification policy? | **Verified = company uses our operations platform.** This makes the marketplace verified-badge a recurring sales pitch for the ops platform. Companies listed but not on the ops platform are still shown, just without the badge. |
| Free → paid transition? | **No forced trigger.** Operators choose to subscribe whenever they perceive enough value. Conversion can be triggered by either marketplace value (visibility / leads) or ops platform value (inspection / fleet) — whichever lands first. |
| Initial data acquisition? | **Manual collection.** ~20 rental companies per city (60 total) sourced from Google Maps + local directories, entered into our DB by us. No scraping pipeline at MVP. Per-vehicle data is never collected from third parties. |
| "Big player" exclusion list? | **Excluded from launch:** Sixt, Hertz, Avis, Europcar, Budget, Enterprise, Thrifty, Alamo, National, and any franchise of an international chain. **Included:** independent local operators and multi-location Baltic operators. |
| Design partners? | **3 confirmed in Riga:** balticcarrent.lv (founder-owned), busrent.lv, ecorent.lv. Get free ops platform access, founding-partner pricing forever, weekly feedback calls. |
| Brand vibe? | **Clean & professional** — Stripe / Linear / Notion energy. Whites, blues, sans-serif, minimal. Communicates "modern SaaS, trustworthy". Drives logo, color palette, typography, photography style. |
| Photo strategy? | **Operators upload their own.** No photographer service offered. Keeps onboarding simple and zero-cost on our side. Photo guidelines published; we don't gatekeep on quality, only on content (no people, plate visibility policy). |
| Founding-partner offer? | **6 months free ops platform + 50% off forever** for design partners (the first 3 in Riga). In exchange: weekly feedback, willingness to be a public reference, photos of premises, openness to share usage data anonymized in pitches. |
| First 10 paying customers offer? | **70% off first year — €90/year (~€7.50/month) instead of €300/year (~€25/month) — with money-back guarantee.** Removes risk for early adopters, creates urgency ("first 10 only"), and gives founder a one-week onboarding sprint to lock them in. |
| Standard subscription price? | **€25/month (€300/year)** for the operations platform. Marketplace listing remains free forever. Pricing reviewed once 50+ paying operators are on the platform. |

---

## 8. Risks & Constraints

1. **Cold-start of marketplace** — needs ~30–50 listed companies per city before customers find it useful. Mitigation: go deep on one city before expanding.
2. **SEO is competitive** — "car rental [city]" is brutal. Compete on long-tail queries and company-name searches.
3. **Inspection photos are still PII-adjacent** — license plates may be visible. Encrypt at rest, set retention policies (e.g. 24 months default), allow operator deletion.
4. **The moat is data, not features** — write everything assuming the operator can export their data on demand. This builds trust and (counterintuitively) reduces churn.

---

## 9. Long-term direction

> A unified operating system + discovery network for small and mid-sized car rental companies.

Future expansion (post-MVP, post-product-market-fit):

- Lead/inquiry tracking inside the operator dashboard
- Booking module (phase 2 of operations)
- Multi-location fleet management
- Insurance integrations
- Cross-rental availability sharing within the network

Competing indirectly with:

- Large rental chains (via collective visibility of small operators)
- SaaS rental management tools (via marketplace distribution advantage)
