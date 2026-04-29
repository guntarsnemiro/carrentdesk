# CarRentDesk — Implementation Roadmap

> Living document. Describes **how** and **when** we build the product defined in [`PRODUCT.md`](./PRODUCT.md).
> Future marketplace features pulled from [`MARKETPLACE.md`](./MARKETPLACE.md).
> Future operator features pulled from [`OPERATIONS.md`](./OPERATIONS.md).
> Update this file as scope, priorities, and architectural decisions evolve.

> ### ⚠️ Active priority (until June 12, 2026): the pitch demo
>
> All work between today and **June 12, 2026** is governed by [`PITCH.md`](./PITCH.md). The 6-week sprint plan there compresses Phase 0 → Phase 3 into a demoable pitch product. After June 12, this roadmap resumes its normal cadence with whatever extra resources the round provides.

---

## Architecture Overview

### Domain layout

```
carrentdesk.com           → public marketplace (SSR, SEO-optimized)
carrentdesk.com/[city]    → per-city listing pages
carrentdesk.com/c/[slug]  → company profile pages
app.carrentdesk.com       → operator dashboard (auth required)
admin.carrentdesk.com     → internal admin panel
```

Single Next.js app, subdomains routed via `middleware.ts` to App Router route groups.

### Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | Already initialized |
| Language | TypeScript | Already initialized |
| Styling | Tailwind CSS v4 | Already initialized |
| UI primitives | shadcn/ui | Add when needed |
| Database | Postgres (Supabase) | RLS for tenant isolation |
| Auth | Supabase Auth | Operator + admin roles |
| Storage | Supabase Storage | Inspection photos |
| Email | Resend | Magic links, PDFs |
| Hosting | Vercel | GitHub auto-deploy |
| Analytics | PostHog | Funnels, session replay |
| PDF generation | `@react-pdf/renderer` or server-side via Puppeteer | Inspection reports |

### Repository structure (target)

```
src/
  app/
    (marketing)/              # carrentdesk.com — public
      page.tsx                # homepage
      [city]/page.tsx         # city listings
      c/[slug]/page.tsx       # company profile
      for-rentals/page.tsx    # B2B landing
    (app)/                    # app.carrentdesk.com — operators
      layout.tsx              # auth gate
      dashboard/page.tsx
      fleet/
      inspections/
      profile/
    (admin)/                  # admin.carrentdesk.com
      layout.tsx              # admin gate
      companies/
      listings/
    api/                      # webhooks, server endpoints
  components/
    marketing/
    app/
    admin/
    ui/                       # shadcn primitives
  features/                   # feature-sliced
    inspection/
    fleet/
    company/
  lib/
    supabase/                 # server + browser clients
    auth/
    db/                       # query helpers, generated types
    pdf/
  middleware.ts               # subdomain routing
docs/
  PRODUCT.md
  ROADMAP.md
```

### Multi-tenancy model

- Single Postgres database, shared by all tenants.
- Every operator-owned table has a `company_id` foreign key.
- Supabase Row-Level Security (RLS) enforces `company_id` matches the user's claim.
- Marketplace queries are public reads with no auth required.

---

## Data Model (initial)

```sql
companies            (id, slug, name, city, country, phone, email, whatsapp, website,
                      description, status, claimed_by_user_id, claimed_at,
                      verified_at, last_active_at, created_at)
                      -- status: 'unclaimed' | 'claimed' | 'verified'
company_amenities    (company_id, amenity_key, value)        -- airport_pickup, english_staff, etc.
company_fleet_summary(company_id, fleet_count_min, fleet_count_max,
                      fleet_description, transmission_mix, fuel_mix, age_range)
                      -- denormalized public-facing fleet info, distinct from real fleet
company_members      (user_id, company_id, role)             -- owner | staff
locations            (id, company_id, address, lat, lng, is_primary)
vehicles             (id, company_id, make, model, year, transmission, seats, fuel,
                      daily_rate, currency, photos, visible_in_marketplace, created_at)
                      -- only used by verified operators; populates per-vehicle marketplace pages
inspections          (id, vehicle_id, company_id, type, performed_by_user_id,
                      performed_at, notes, locked_at)        -- pickup | return
damages              (id, inspection_id, position_x, position_y, side, severity,
                      photo_url, notes)
inspection_photos    (id, inspection_id, url, taken_at)
claim_tokens         (id, company_id, token, sent_to_email, sent_at, used_at, expires_at)
audit_log            (id, company_id, actor_user_id, entity, entity_id, action, diff, at)
```

Notes:

- `companies.status` drives all public marketplace rendering decisions (photos, badges, per-vehicle pages).
- `verified` is automatically computed from `last_active_at` — when an operator does an inspection, `last_active_at` updates, status flips to `verified`. If they go inactive (90+ days), status returns to `claimed`.
- `claim_tokens` are issued via outreach — one-click claim from email/WhatsApp link.
- `company_fleet_summary` is the **public marketplace fleet description**. It is intentionally separate from the `vehicles` table so unclaimed/claimed listings have meaningful fleet info without per-vehicle data.
- `inspections` are immutable once `locked_at` is set.
- `audit_log` is append-only — used for dispute resolution and operator trust.
- No `customers` or `bookings` tables in MVP.

---

## Phased Plan

### Phase 0 — Foundation (Week 1–2) ⏳ IN PROGRESS

Goal: a marketplace shell deployed on a real domain, ready for sales conversations.

- [x] Next.js project initialized
- [x] GitHub repo connected
- [ ] Vercel deployment (blocked on account access)
- [ ] Custom domain + DNS
- [ ] Supabase project provisioned
- [ ] Supabase client setup (server + browser)
- [ ] Subdomain middleware (placeholder for `app.` and `admin.`)
- [ ] Marketing homepage with placeholder copy and brand
- [ ] Static city page template (no real data yet)
- [ ] Company profile page template (static demo data)
- [ ] Basic SEO: metadata, sitemap.xml, robots.txt, OG images
- [ ] Add `shadcn/ui` and base components (Button, Input, Card)

**Deliverable:** Live URL we can show to a rental company in a sales call.

---

### Phase 1 — Marketplace data layer + manual seeding (Week 3–4)

Goal: real companies (unclaimed) populating the marketplace, rendered on public pages with the cleaner unclaimed-listing UX.

- [ ] Database schema: `companies` (with status), `company_amenities`, `company_fleet_summary`, `locations`, `claim_tokens`
- [ ] RLS policies (public read on marketplace tables; admin write)
- [ ] Admin auth (single role: internal staff)
- [ ] Admin UI: create/edit/delete companies, amenities, fleet summary
- [ ] Manual seeding: 60 companies entered (Riga 20, Tallinn 20, Vilnius 20)
- [ ] Public city pages query real data, company-level cards
- [ ] Public company profile pages query real data, with status-aware rendering:
  - `unclaimed` — clean placeholder layout, no photos, no claim CTA visible to customers
  - `claimed` — operator-uploaded photos and edited copy
  - `verified` — verified badge, per-vehicle pages enabled
- [ ] Filters: city, services / amenities, fleet size range
- [ ] Direct-contact CTAs (phone, WhatsApp, email, website) on profile pages
- [ ] Anonymous contact-click tracking
- [ ] SEO per page (dynamic metadata, `LocalBusiness` structured data)
- [ ] **Customer-facing pages must show zero claim/scrape signals** — pages look like normal directory entries

**Deliverable:** Marketplace populated with 60 real rental companies across all three cities, all unclaimed, looking polished and trustworthy.

---

### Phase 2 — Operator authentication & claim flow (Week 5–6)

Goal: rental companies (starting with 3 design partners) can claim and manage their listing.

- [ ] Supabase Auth setup (magic link via Resend)
- [ ] `company_members` table + role-based access
- [ ] JWT custom claims (`company_id`, `role`)
- [ ] RLS policies tied to `company_id` claim
- [ ] Claim flow:
  - [ ] `claim_tokens` generated by admin → personalized URL
  - [ ] Token-based claim page: confirm ownership, set primary email, create user
  - [ ] Status transitions to `claimed` on success
- [ ] B2B landing page `/for-rentals`:
  - [ ] "Find your business" search → claim CTA
  - [ ] Pitch copy + founding-partner offer
- [ ] Operator dashboard layout on `app.` subdomain
- [ ] Operator company profile editing (description, photos, amenities, fleet summary)
- [ ] Operator vehicle CRUD (real fleet, not just summary)
- [ ] Photo upload via Supabase Storage with client-side compression
- [ ] Subtle "For rental owners" footer link on public marketplace
- [ ] **Onboard 3 design partners**: balticcarrent.lv, busrent.lv, ecorent.lv

**Deliverable:** 3 design partners have claimed listings with photos and edited copy. Marketplace now visibly mixes unclaimed + claimed listings.

---

### Phase 3 — Inspection tool (the moat) (Week 7–10)

Goal: the daily-use feature that drives retention and dispute defense. Also the trigger that flips listing status from `claimed` → `verified`.

- [ ] Database schema: `inspections`, `damages`, `inspection_photos`
- [ ] Mobile-first inspection UI (PWA, optimized for phone in a parking lot)
- [ ] Photo capture with client-side compression
- [ ] Resumable upload to Supabase Storage
- [ ] Vehicle silhouette SVGs (sedan, SUV, hatchback, van)
- [ ] Tap-to-pin damage marking
- [ ] Damage form: severity, side, notes, photo attached to pin
- [ ] Inspection types: pickup vs return
- [ ] Side-by-side compare view (pickup vs return)
- [ ] Immutable lock on submit
- [ ] Inspection history per vehicle (timeline)
- [ ] PDF export of inspection report
- [ ] Audit log of every state change
- [ ] **Status auto-transition**: completing an inspection updates `companies.last_active_at`; status flips to `verified` automatically
- [ ] Verified badge appears on public marketplace
- [ ] Per-vehicle pages unlock for verified operators

**Deliverable:** Operator opens the app every day to do pickup/return inspections.

---

### Phase 4 — Polish & sales acceleration (Week 11–12)

Goal: tighten everything, prepare for paid plans.

- [ ] Onboarding flow (operator first-run experience)
- [ ] Email notifications (inspection completed, weekly digest)
- [ ] Operator analytics: profile views, marketplace clicks
- [ ] Marketplace search (full-text + filters)
- [ ] Performance pass (Lighthouse > 90 mobile)
- [ ] Accessibility pass (WCAG AA basics)
- [ ] PostHog funnels: visit → contact-click → operator notification
- [ ] Internal "Claim this listing" tooling
- [ ] B2B landing page with demo video

**Deliverable:** Product feels finished. Ready to expand to a second city.

---

### Phase 5+ — Future (post-MVP)

Not committed. Direction only. Sources of truth: [`MARKETPLACE.md`](./MARKETPLACE.md) and [`OPERATIONS.md`](./OPERATIONS.md).

Likely sequencing once MVP has paying users:

**Operator side (deepens the moat)**

1. **Lead pipe** — inquiry inbox, conversion tracking, lead source attribution (OPERATIONS §7).
2. **Customer CRM-light** — customer profiles, rental history, license storage per tenant (OPERATIONS §3, §8.1).
3. **Booking engine** — availability calendar, manual + online bookings, conflict detection (OPERATIONS §1.1).
4. **Pricing engine** — daily/seasonal/weekend pricing, long-term discounts (OPERATIONS §1.2).
5. **Workflow automation** — pickup → rental → return → close pipeline, task system, alerts (OPERATIONS §5).
6. **Maintenance management** — service schedules, cost tracking per vehicle (OPERATIONS §2.3).
7. **Financial dashboards** — revenue/cost/profit per vehicle, fleet profitability ranking (OPERATIONS §6).
8. **Damage cost tracking** — repair estimates, deposits, lifetime damage per vehicle (OPERATIONS §4.3).
9. **Multi-location support** — branches, shared fleet, transfers (OPERATIONS §9).
10. **Risk scoring** — customer risk profiles, blacklist, damage likelihood (OPERATIONS §8.2).

**Marketplace side (widens the funnel)**

11. **Inquiry / quote forms** — structured customer-to-operator messaging (MARKETPLACE §5.3, §5.4).
12. **Reviews & ratings** — once we have traffic volume to make them meaningful (MARKETPLACE §4.2).
13. **Editorial content** — city guides, FAQs, regulations per country (MARKETPLACE §8).
14. **Map view + geolocation** — "rentals near me" experience (MARKETPLACE §1.6, §9.2).
15. **Featured placement** — paid promotion within cities (MARKETPLACE §9.4 — first monetization lever).
16. **Cross-rental availability sharing** — network effect when one rental is sold out (MARKETPLACE §9.5, requires OPERATIONS §1.3).
17. **Multi-language UI** — LV / EN / RU likely first (MARKETPLACE §11).
18. **Comparison & favorites** — customer-side discovery tools (MARKETPLACE §7.2, §7.4).

**Cross-cutting**

19. **Channel sync** — marketplace ↔ ops availability source of truth (OPERATIONS §1.3 ↔ MARKETPLACE §2.5).
20. **Paid plans** — Stripe billing, founding-customer grandfathering.
21. **Native mobile app** — only if PWA proves insufficient.

Sequencing principle: **moat-first on the operator side, funnel-first on the marketplace side**. Operator features that accumulate irreplaceable per-tenant data are prioritized over those that are merely "nice to have." Marketplace features are prioritized by impact on contact-clicks-per-listing.

---

## Working Conventions

- **Branch model:** trunk-based. Push small commits to `main`. Feature branches only for big changes.
- **Migrations:** Supabase migrations checked into `supabase/migrations/`.
- **Types:** generate Supabase types into `src/lib/db/types.ts` (CI step later).
- **Server actions** preferred over REST endpoints for operator forms.
- **No comments that narrate code** — only intent / non-obvious decisions.
- **Every PR / commit** must keep `npm run build` and `npm run lint` green.

---

## Open Implementation Questions

- Final brand / visual identity — placeholder OK for Phase 0, decide before public launch.
- PDF generation: server-side Puppeteer (heavier, pixel-perfect) vs `@react-pdf/renderer` (lighter, programmatic). Decide in Phase 3.
- City list strategy: hardcoded for first launch city, dynamic table later.
- Image CDN: Vercel image optimization is fine until volumes justify a dedicated service (Cloudinary / imgix).
