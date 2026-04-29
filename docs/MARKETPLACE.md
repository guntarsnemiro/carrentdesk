# CarRentDesk — Marketplace: Full Functional Map

> Long-term reference. Describes the **complete vision** of the customer-facing marketplace.
> This is a feature universe, not a delivery plan.
> See [`PRODUCT.md`](./PRODUCT.md) for strategy, [`OPERATIONS.md`](./OPERATIONS.md) for the operator-facing platform, and [`ROADMAP.md`](./ROADMAP.md) for what we actually build and when.

---

## Guiding Principle

> The marketplace is a **discovery surface**, not a transaction platform.

It exists to:

1. Help customers find the right local rental fast.
2. Generate organic traffic and SEO authority.
3. Make small/local rentals visible against international brands.
4. Hand the customer off to the rental company via direct contact.
5. Feed visibility data back to operators to prove ROI.

What the marketplace must **never** do (firm boundary):

- ❌ Process bookings or payments
- ❌ Collect customer documents (license, ID)
- ❌ Hold customer funds (deposits, prepayments)
- ❌ Act as the rental contract counterparty

The marketplace surface is "Tripadvisor for local rentals," not "Airbnb for cars."

| Customer enters | Customer leaves |
|---|---|
| via search / SEO / direct | via phone / WhatsApp / email / company website |

Functions are grouped by **customer outcome**, not by software module.

---

## 1. Discovery & Search

> Goal: get a customer from "I need a car in [city]" to a relevant listing in under 30 seconds.

### 1.1 Homepage

- Hero with city/location selector
- Featured cities (the cities we have real inventory in)
- "How it works" strip (find → contact → drive)
- Trust signals (number of listed companies, cities covered)
- Soft CTA for rental companies ("List your business →")

### 1.2 City / location pages

- Hero per city (image, copy, count of listings)
- All vehicles available in this city
- Filter sidebar (see §1.4)
- Map view (later)
- SEO-optimized URL: `/[country]/[city]`
- Per-city editorial copy (see §8 Content)

### 1.3 Search bar

- Global search across the marketplace
- Autocomplete: cities, companies, vehicle types
- Recent searches (anonymous, browser-side)
- Misspelling tolerance

### 1.4 Filters

**Company-level filters (always available, MVP)**

- City
- Services / amenities (airport pickup, city delivery, cross-border, English staff, 24/7, child seats, winter tires, long-term discounts, card payments)
- Fleet size range (e.g. "small fleet 1–5", "medium 6–20", "large 20+")

**Vehicle-level filters (only when matching against verified operators with per-vehicle data)**

- Vehicle type (sedan, SUV, hatchback, van, convertible, luxury, etc.)
- Transmission (manual / automatic)
- Fuel type (petrol, diesel, hybrid, electric)
- Seats (2, 4, 5, 7, 9+)
- Daily price range
- Year range
- Features (AC, GPS, child seat compatible, roof rack, tow bar, winter tires)

When vehicle-level filters are applied, the result set automatically narrows to verified operators (the only ones with per-vehicle data). A subtle hint may explain this: "Showing rentals with detailed vehicle listings."

### 1.5 Sorting

- Relevance (default)
- Price low → high
- Price high → low
- Newest listings
- Distance from selected location (later)
- Highest rated (when reviews exist)

### 1.6 Map view (later)

- Map with vehicle pins per company location
- Click to preview
- Filter the map view by the same filters as list view
- Mobile-optimized

### 1.7 Saved search & alerts (later)

- Save a filtered search
- Email alert when new vehicles match
- Requires lightweight customer email capture (no full account)

---

## 2. Listings & Content

The marketplace operates at **company level** by default. Per-vehicle pages exist only for `verified` operators (those using the ops platform), as a bonus surface from their fleet data.

### 2.1 Company listing card (search result)

The default unit on city pages and search results.

Always shown:

- Company name + city
- Fleet count (e.g. "8 vehicles")
- Fleet description short form (e.g. "5–10 year automatic diesels")
- Top 3 services as icons (airport pickup, English staff, etc.)
- Verified badge if applicable
- Primary direct-contact CTA (call or WhatsApp)

Shown when claimed/verified:

- Logo
- Cover photo

Unclaimed listings show a clean **icon/initials placeholder** instead of a logo, and no cover photo. This still looks polished, not empty.

### 2.2 Company detail page (`/c/[slug]`)

The primary destination from search. See §3.2 for full layout.

Key principle: an unclaimed listing must look **complete and trustworthy**, not stub-like. Achieved by emphasizing:

- Clean typography
- Clear contact CTAs front-and-center
- Fleet description and services prominently displayed
- Map and address
- "Photos available — contact rental for details" line where photos would be (optional, only if it tests well)

### 2.3 Vehicle listing card (verified operators only)

Same as the original spec — appears only when the operator is verified and has uploaded fleet data via the ops platform.

- Primary photo
- Make, model, year
- Daily rate + currency
- Transmission, seats, fuel
- Linked to parent company

### 2.4 Vehicle detail page (verified operators only)

- Full photo gallery (swipeable on mobile)
- Specs table: make, model, year, transmission, fuel, seats, doors, luggage capacity
- Features list (AC, GPS, Bluetooth, winter tires, etc.)
- Daily rate + any visible long-term discounts
- Operator-set description / notes
- Pickup locations
- Company profile preview card with direct-contact CTAs
- Similar vehicles section
- Breadcrumbs: Country → City → Company → Vehicle

### 2.5 Photo handling

- Photos exist only for claimed and verified listings
- Unclaimed listings have **no photos** and no fake/stock photos either — the layout is designed to look complete without them
- Multiple photos per vehicle (verified operators)
- Optimized via Next/Image (responsive, lazy)
- Lightbox / fullscreen view
- Image alt text auto-generated for SEO
- Operator-uploaded order preserved

### 2.6 Pricing display (verified operators only)

- Daily rate as the primary number
- Optional 3-day / 7-day / 30-day rates if operator provides them
- "Contact for long-term pricing" fallback
- Currency clearly shown
- No hidden fees displayed (operator discloses on contact)

For unclaimed / claimed-without-vehicle-data listings, no specific pricing is shown — just the contact CTAs.

### 2.7 Availability (later, requires ops integration)

- Calendar showing rough availability (green / yellow / red windows)
- Sourced from the operator's booking system once they use ours
- Until then: "Contact rental for availability"

---

## 3. Company Profiles

### 3.1 Listing status model

Every company has one of three statuses. The status is **invisible to customers** — to them, all listings look the same. The differences are in what content is shown.

| Status | How achieved | Public content |
|---|---|---|
| `unclaimed` | Entered by us during launch | Company info, fleet description, contact, services. No photos. |
| `claimed` | Operator logged in and confirmed ownership | All of the above + operator-edited copy + operator-uploaded photos |
| `verified` | Claimed AND uses the operations platform | All of the above + verified badge + per-vehicle pages + higher search rank |

**Customers never see claim prompts.** No "Claim this listing" CTAs on the public marketplace surface. The marketplace looks like a curated directory, not a scraped database.

Operators reach the claim flow only through:

- Direct outreach links we send them
- `/for-rentals` B2B landing page → "Find your business" search
- `app.carrentdesk.com` first-visit business search
- Subtle "For rental owners" footer link

### 3.2 Company landing page (`/c/[slug]`)

Always shown (regardless of status):

- Company name + city
- Short description
- Address + map pin
- Direct-contact CTAs (see §5): phone, email, WhatsApp, website
- Fleet count (e.g. "8 vehicles")
- Fleet description (e.g. "5–10 year automatics, mostly diesel")
- Services / amenities (see §3.4)
- Hours of operation (when available)
- Verified badge (only if status = `verified`)

Shown when claimed or verified:

- Cover image
- Operator-uploaded photos (premises, fleet samples)
- Operator-edited "About / story" copy
- Multiple locations with individual maps
- Languages spoken by staff
- Social links (Instagram, Facebook)

Shown when verified only:

- Per-vehicle pages and gallery (sourced from operator's fleet in the ops platform)
- Verified badge
- Higher position in search results

### 3.3 Verified badge

- Granted automatically when an operator's company actively uses the operations platform (e.g. has completed at least one inspection in the last 30 days)
- Lost if usage stops (configurable threshold, e.g. 90 days inactive)
- Visual: small badge near the company name, with hover/tap explanation: "This rental uses CarRentDesk for vehicle inspections — every rental is documented with photos."
- Marketing principle: never inflated, never bought. Verified means active operational use, period.

### 3.4 Services & amenities (filterable)

Boolean flags shown on each company:

- ✈️ Airport pickup
- ✈️ Airport delivery
- 🏙️ City delivery
- 🌍 Cross-border rental allowed
- 🇬🇧 English-speaking staff
- 🕐 24/7 service
- 👶 Child seats available
- ❄️ Winter tires included
- 📅 Long-term rental discounts
- 💳 Card payments accepted

### 3.5 Multi-location companies

- Single company profile, multiple location cards
- Each location has its own address, phone, hours
- Filterable on city pages by location (when claimed)

---

## 4. Trust & Social Proof

### 4.1 Trust signals (always-on)

- Verified company badge
- Years listed on CarRentDesk
- Fleet size
- Photos of premises (where available)
- Direct phone number (not anonymized — we want them to call directly)

### 4.2 Reviews & ratings (later)

- Customer reviews per company (not per vehicle, to keep volume meaningful)
- Star rating (1-5)
- Written review optional
- Operator response option
- Moderation queue (admin-side)

> Reviews are deferred until we have enough customer traffic to generate meaningful volume. Empty review sections actively hurt trust.

### 4.3 Editorial trust signals (later)

- "Featured in local press" mentions where applicable
- Awards / certifications (operator-uploaded, admin-approved)

---

## 5. Lead Generation & Contact (the conversion event)

> Goal: every page makes it trivial to contact the rental company in their preferred channel.

### 5.1 Direct-contact CTAs

Each company / vehicle page exposes:

- **Call** — `tel:` link, opens phone dialer on mobile
- **WhatsApp** — `https://wa.me/` deep link with prefilled message ("Hi, I'm interested in [Vehicle] on [Date]")
- **Email** — `mailto:` link with prefilled subject and body
- **Website** — direct link to company's own website if they have one

Each CTA is **tracked client-side** (without personally identifying the customer) and surfaced in the operator dashboard as a contact event.

### 5.2 Contact tracking

- Every contact CTA click logged anonymously
- Aggregated per company / per vehicle / per day
- Visible in the operator dashboard as `Listing → Contact clicks`
- This is the operator's primary ROI signal

### 5.3 Inquiry / contact form (later)

- Optional structured form for customers who don't want to call
- Captures: name, contact preference, dates, vehicle interest
- Routed to the operator's inquiry inbox in the ops platform
- Triggers an email/SMS to the operator
- See OPERATIONS.md §7.2

### 5.4 Quote request (later, requires pricing engine)

- Customer enters dates → operator's pricing engine returns a quote
- Quote is informational only (not a binding booking)
- Operator follows up to close

---

## 6. SEO & Discoverability

> Goal: rank for high-intent rental queries in every city we serve.

### 6.1 URL structure

```
/                                          # homepage
/[country]                                 # country index (later)
/[country]/[city]                          # city listings
/[country]/[city]/[vehicle-type]           # filtered city pages
/c/[company-slug]                          # company profile
/c/[company-slug]/v/[vehicle-slug]         # vehicle detail
/guides/[slug]                             # editorial content (later)
```

All URLs human-readable, slug-based, lowercase, hyphenated.

### 6.2 Metadata & structured data

- Per-page `<title>` and `<meta description>` (dynamic)
- Open Graph tags (og:title, og:image, og:description)
- Twitter Card tags
- JSON-LD structured data:
  - `LocalBusiness` for company pages
  - `Vehicle` (or `Product`) for vehicle pages
  - `BreadcrumbList` everywhere
  - `Organization` site-wide
  - `Review` / `AggregateRating` once reviews exist

### 6.3 Technical SEO

- `sitemap.xml` (auto-generated, includes all public pages)
- `robots.txt`
- Canonical URLs on all pages
- 301 redirects on slug changes
- Fast Largest Contentful Paint (Next.js SSR + image optimization)
- Mobile-first (Google indexes mobile primarily)

### 6.4 Long-tail content strategy

- Per-city × per-vehicle-type landing pages (e.g. `/lv/riga/manual-transmission`)
- Editorial guides (see §8)
- FAQ pages
- "Best for [purpose]" pages ("best rental for road trip in Latvia")

### 6.5 Multi-language SEO (later)

- Per-language URL prefixes (`/en/...`, `/lv/...`, `/ru/...`)
- `hreflang` tags
- Translated content (not auto-translated metadata)

---

## 7. Customer Experience

### 7.1 Mobile-first UI

- Single-thumb operability
- Large tap targets for contact CTAs
- Sticky bottom bar with contact buttons on vehicle pages
- Lightweight pages (target < 100KB JS on first load)

### 7.2 Comparison (later)

- Compare up to 3 vehicles side by side
- Spec table comparison
- "Compare" pin on listing cards

### 7.3 Recently viewed (anonymous)

- Browser-stored list of last 10 viewed vehicles
- Surfaced in a strip on relevant pages
- No backend persistence required

### 7.4 Favorites / shortlists (later, requires light customer auth)

- Save vehicles to a list
- Share the list as a URL
- Email the list to oneself
- May require email capture only (no full account)

### 7.5 Sharing

- Native share sheet on mobile
- Copy-link button
- Pre-formatted social previews via OG tags

### 7.6 Accessibility

- WCAG AA baseline
- Keyboard navigation throughout
- Alt text on all images
- Sufficient color contrast
- Screen-reader-friendly contact CTAs

---

## 8. Content & Editorial

> Goal: long-tail SEO + trust building. Content the rental companies couldn't write themselves.

### 8.1 City guides

- "Driving in [city]" — parking, fuel stations, rules, tolls
- "Best driving routes near [city]"
- Practical info: license requirements, insurance, age minimums

### 8.2 Rental FAQs

- What documents do I need to rent?
- How does the deposit work?
- Manual vs automatic in the EU
- What is included in the daily rate?
- Cross-border rules

### 8.3 Country-specific regulations

- Speed limits
- Mandatory equipment (winter tires, vests, triangle)
- Toll roads
- Parking rules

### 8.4 Editorial voice

- Local, practical, no fluff
- Written or reviewed by humans
- Updated when regulations change
- Linked from contextually relevant listings

---

## 9. Network & Cross-Rental Features

### 9.1 "Similar cars at other rentals"

- Shown on every vehicle detail page
- Same vehicle type / similar price tier / same city
- Increases discovery of small operators

### 9.2 "Rentals near you" (later, requires geolocation prompt)

- Geolocate browser → show closest rentals
- Privacy-respecting (in-browser prompt, opt-in)

### 9.3 City-wide visibility ranking (operator-facing)

- Each operator sees how their listings rank against competitors in their city
- Metrics: search appearances, click-through rate, contact rate
- Surfaced in the operator dashboard, not in the public marketplace

### 9.4 Featured placement (monetization, later)

- Paid promotion within a city
- Always clearly labeled as "Featured"
- Capped (e.g. max 3 featured slots per city) to preserve trust

### 9.5 Cross-rental availability sharing (long-term, requires ops integration)

- If Rental A is sold out, suggest Rental B in the same city with similar inventory
- Operators opt in
- Creates network value: even when you can't help a customer, they stay on CarRentDesk

---

## 10. Operator Visibility Data (feedback loop)

Marketplace data that flows back to the operator dashboard:

- Listing views (per vehicle, per company, per day)
- Search appearances (how often the listing showed up in results)
- Contact clicks broken down by channel (call / WhatsApp / email / website)
- Top search filters that surfaced the listing
- Visibility score vs city competitors
- Inquiry conversion (when forms exist) — see §5.3

> This is the proof-of-ROI surface. It is what justifies the future paid plan.

See OPERATIONS.md §7.1 for how this is presented operator-side.

---

## 11. Internationalization (later)

### 11.1 Multi-language UI

- Initial languages: LV, EN, RU (Baltic launch market)
- Per-language URL prefix
- Language switcher in header
- Operator content shown in original language with translation hints (Phase 2)

### 11.2 Multi-currency

- Display currency configurable per visitor (EUR default)
- Conversion rates updated daily
- Operator sets the base currency; marketplace displays converted

### 11.3 Multi-country expansion

- Country selector in header
- Per-country regulatory content (see §8.3)
- Per-country pricing standards (e.g. weekly rates more common in some markets)

---

## 12. Customer Accounts (deliberately deferred)

We intentionally avoid customer accounts for as long as possible. They add:

- Auth complexity
- GDPR scope
- Password / account-recovery support load
- Friction for first-time visitors

Customer accounts will only be added when a feature **truly requires identity persistence** (e.g. saved searches with email alerts, favorites synced across devices). Even then, prefer **lightweight email-only capture** over passwords.

What we will **not** do:

- ❌ Customer login as a default
- ❌ Customer profile pages with PII
- ❌ Customer-side document upload (driver license, ID)
- ❌ Customer-stored payment methods

---

## How this document is used

- **ROADMAP.md** pulls items from here into delivery phases.
- **PRODUCT.md** sets the strategic boundary — anything in here that contradicts strategy is out of scope.
- **No item in this document is committed** until it appears in ROADMAP.md.
- New marketplace ideas → add here first, decide later if/when to roadmap them.

The marketplace's success metric is simple: **contact clicks per listing per month**. Every feature in this document either increases discovery (more listings get found) or increases conversion (more found listings get clicked). Features that do neither don't belong here.
