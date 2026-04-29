# CarRentDesk — Personal TODO

> Personal action list. Check items off as they're done.
> For strategy: [`PRODUCT.md`](./PRODUCT.md). For delivery: [`ROADMAP.md`](./ROADMAP.md).
>
> ### ⚠️ Active priority: June 12, 2026 demo-day pitch
>
> The pitch deadline overrides everything else in this list. See [`PITCH.md`](./PITCH.md) for the 6-week sprint plan, demo script, and pre-pitch outreach. Items in this TODO that don't serve June 12 are deferred until after the pitch.

---

## Locked decisions ✅

- Cities: **Riga (focus), Tallinn, Vilnius** — all live at launch, 80% outbound on Riga first
- Language: **English** at launch
- Domain: **carrentdesk.com** (registered)
- Verification: company uses our **operations platform**
- Free → paid: **operator chooses when**, no forced trigger

---

## 🔴 Top priority this week (pitch-critical)

- [ ] **Book Anna Andersone mentoring session** — the single highest-leverage action available. Ideally before May 7.
- [ ] **Read 2-3 Printify origin-story articles** — note Jānis' phrasing on supply-side strategy
- [ ] **Read Māris Veide's last 6 months of LinkedIn posts** — understand his pattern recognition
- [ ] **Identify other Startschool cohort startups** pitching June 12 — understand the competition

## This week (pre-code essentials)

The minimum needed before writing app code is meaningful.

### Infrastructure & accounts

- [ ] Vercel account access resolved (waiting on support)
- [ ] Cloudflare account → add `carrentdesk.com` for DNS + free SSL/CDN
- [ ] Supabase: create project `carrentdesk-prod` → save URL + anon key
- [ ] Supabase: create project `carrentdesk-dev` (separate dev DB)
- [ ] Resend account → verify `carrentdesk.com` for transactional email
- [ ] PostHog account → create project `carrentdesk` → save API key
- [ ] Google Search Console → verify domain (DNS TXT record)
- [ ] Bing Webmaster Tools → verify domain
- [ ] Set up `hello@carrentdesk.com` (Cloudflare Email Routing → personal Gmail is free and fastest)

### Brand & social

- [ ] Reserve `@carrentdesk` on Instagram, Facebook, LinkedIn, X, TikTok
- [ ] Pick brand vibe direction (clean/professional vs warm/local vs trust/banking)
- [ ] Pick 2 fonts (one display, one body — Google Fonts only for performance)
- [ ] Pick 4-5 brand colors → save as `tailwind.config` later
- [ ] Logo/wordmark: DIY in Canva or order on Fiverr (€50-200, ~3 days turnaround)
- [ ] Trademark check: search "CarRentDesk" in EUIPO database (https://euipo.europa.eu)

---

## Sales & data prep (the marketplace's actual fuel)

Without listings, the marketplace is empty regardless of code quality. Approach: **manual collection**, ~20 listings per city, total ~60 listings before launch.

### Cost expectation

- Google Places API would be free under their $200/month tier (~$3 for 60 listings)
- Manual is recommended anyway — better data quality, no scraping ethics, you QA each one as you collect

### Listing data to collect (per company)

- Company name
- City + full address
- Phone number
- Email (if findable)
- Website
- Short description (1-2 sentences from their website if available, otherwise we'll write it)
- Fleet count estimate (e.g. "5-10 vehicles")
- Fleet description (e.g. "Mostly 5-10 year automatic diesels")
- Services / amenities (booleans):
  - Airport pickup, airport delivery, city delivery
  - Cross-border allowed
  - English-speaking staff
  - 24/7 service
  - Child seats available
  - Winter tires included
  - Long-term rental discounts
  - Card payments accepted
- Hours of operation (if findable)
- Notes / contact attempt status

### Target rental list — Riga (priority — 80% of effort)

- [ ] Confirm design partners onboarded:
  - [ ] balticcarrent.lv (founder-owned)
  - [ ] busrent.lv
  - [ ] ecorent.lv
- [ ] Collect ~20 additional Riga rentals (excluding big players — see PRODUCT.md exclusion list)
- [ ] Source: Google Maps "car rental Riga", zl.lv, local directories
- [ ] QA pass: open each website to verify they're still operating

### Target rental list — Tallinn & Vilnius (post-Riga)

- [ ] Tallinn: ~20 companies (focus shifts here once Riga has ~40 listings)
- [ ] Vilnius: ~20 companies (focus shifts here once Tallinn has ~30 listings)

### Outreach assets (for design partners + post-launch outreach)

- [ ] Write phone script (1 min opener for cold call)
- [ ] Write email template (subject line + 80-word body + CTA)
- [ ] Write WhatsApp template (3-line intro)
- [ ] Write founding-partner offer:
  - Free listing forever
  - Free ops platform during MVP + permanent founding-partner pricing
  - In exchange: weekly feedback calls, photos of premises, willingness to be a reference
- [ ] (Optional) 5-slide pitch deck for Zoom demos
- [ ] Magic-link claim email template (sent after manual outreach: "Click here to manage your listing")

---

## Content drafts

Write in plain text / Google Docs first. We paste finished copy into the code later.

- [ ] Homepage copy
  - Headline (≤8 words)
  - Subheadline (1-2 sentences)
  - 3-bullet value prop
  - "How it works" 3-step strip
  - Trust signal (e.g. "X rentals across the Baltic")
  - Primary CTA + secondary CTA
- [ ] For-rentals B2B landing page copy
  - Pain headline ("Stop losing damage disputes")
  - Problem → solution narrative
  - Inspection tool feature highlights
  - Pricing teaser ("Free during launch")
  - CTA: "Book a demo"
- [ ] About / mission page (short, sets tone)
- [ ] FAQ — 8-10 questions customers actually ask
- [ ] Privacy Policy v1 (use https://www.iubenda.com or similar generator; lawyer review later)
- [ ] Terms of Service v1 (same approach)
- [ ] Cookie notice copy

---

## Design / UX

Even rough sketches save days of coding back-and-forth.

### Wireframes (paper or Figma — both fine)

- [ ] Marketplace homepage
- [ ] City listing page (Riga)
- [ ] Company profile page
- [ ] Vehicle detail page
- [ ] Operator dashboard (post-login)
- [ ] Inspection capture flow — mobile-first (the most important one)

### Mood board

- [ ] Save 5-10 reference screenshots in a `mood-board/` folder
  - Booking.com, Turo, Getaround, Airbnb (UX gold standards)
  - Local rentals you find inspiring or terrible (both useful)
  - Non-rental inspirations (Stripe, Linear, Notion for clean SaaS)
- [ ] Note 3 things you want to copy and 3 things you want to avoid

### Photography baseline

- [ ] Decide: do operators upload their own photos? (recommended: yes)
- [ ] Decide: do we offer to send a photographer for founding partners?
- [ ] Write minimum photo standards doc (per vehicle: 1 front, 1 rear, 1 side, 1 interior, 1 dashboard)
- [ ] Write photo guidance for operators (lighting, angles, no people, plate visible-or-blurred policy)

---

## Process & ops

- [ ] Pick a task tracker (GitHub Issues / Linear / Notion) and stick to it
- [ ] Schedule weekly 30-min calls with first 3 design-partner rentals (once they're signed up)
- [ ] Decide what design partners get (probably: free forever or huge permanent discount)
- [ ] Decide what we get from them (weekly feedback calls, willingness to be a reference, willingness to share screenshots)

---

## Legal & admin

Low urgency, but plan now.

- [ ] Talk to a Latvian accountant about business entity (SIA standard)
- [ ] Confirm GDPR baseline: cookie banner + privacy notice required before public launch
- [ ] Decide: who is the data controller? (Probably the SIA once formed)
- [ ] Decide on a retention policy for inspection photos (24 months default is reasonable)
- [ ] Trademark application (post-MVP, once name is confirmed)

---

## Optional but high-leverage

- [ ] Buy `carrentdesk.lv`, `carrentdesk.ee`, `carrentdesk.lt`, `.eu` (cheap defensive registrations)
- [ ] Reserve `carrentdesk` on Product Hunt for future launch
- [ ] Set up a simple "coming soon" page on the domain pointing to a waitlist email capture (gives time to validate interest while we build)
- [ ] Start a private design-partner Slack/WhatsApp group when first 3 sign on
- [ ] Build a simple internal "CRM" — even a Google Sheet — tracking every outreach contact

---

## Once 60% of this is done → start Phase 0 in ROADMAP.md

We don't need 100% of pre-code work done before coding. The minimum to start Phase 0 is:

1. Domain DNS configured (Cloudflare)
2. Supabase project created
3. Vercel access (or alternative chosen)
4. Brand colors + fonts picked
5. Homepage copy drafted
6. ~10 Riga rentals identified (the 3 design partners + ~7 manually collected)

Everything else can be done in parallel with development.

---

## Notes / decisions log

> Use this section to capture decisions you make so they don't get lost.

- _2026-04-29_ — Cities locked: Riga (focus), Tallinn, Vilnius. English only at launch.
- _2026-04-29_ — Verification = active use of the ops platform.
- _2026-04-29_ — No forced free→paid trigger; operator chooses.
- _2026-04-29_ — Initial data: manual collection (~20 per city). No scraping pipeline at MVP. No third-party photos.
- _2026-04-29_ — Listing status model: `unclaimed` / `claimed` / `verified`. Customer never sees claim CTAs. Verified badge is the only public differentiator.
- _2026-04-29_ — Per-vehicle pages exist only for `verified` listings. Default unit is company-level.
- _2026-04-29_ — Design partners: balticcarrent.lv (founder), busrent.lv, ecorent.lv. All Riga-based.
- _2026-04-29_ — Big players excluded: Sixt, Hertz, Avis, Europcar, Budget, Enterprise, Thrifty, Alamo, National.
- _2026-04-29_ — Brand vibe: clean & professional (Stripe / Linear / Notion direction).
- _2026-04-29_ — Photos: operators upload their own. No photographer service.
