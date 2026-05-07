# Listings sourcing & enrichment plan

Last updated: May 7 2026
Status: Active — running Path A+ (Apify + agent website enrichment) before
the June 12 investor pitch.

## Goal

Populate `companies` with ~60 real local rentals (Riga / Tallinn / Vilnius)
so the marketplace looks like a working two-sided platform on June 12.

| City | Target | Verified | Unclaimed (to source) |
| ---- | ------ | -------- | --------------------- |
| Riga | 20 | 3 design partners | ~17 |
| Tallinn | 20 | 1 (placeholder) | ~19 |
| Vilnius | 20 | 1 (placeholder) | ~19 |

## Data we collect (and don't)

Per the marketplace rule "no photos / no fleet detail until claimed", scraped
listings ship with `status = 'unclaimed'` and only:

- name, slug, city, country
- primary location address
- phone, website
- best-guess `vehicle_types[]`

We deliberately **skip** for unclaimed listings:

- email (privacy)
- description text (don't paraphrase their marketing)
- photos
- detailed fleet breakdown
- amenities

If website enrichment surfaces clearly public info (services list, languages,
fleet size estimate), we include it. When in doubt, leave blank — operators
fill it in when they claim.

## Pipeline

```
[Apify free tier]
  searchStringsArray: [
    "car rental Riga, Latvia",
    "car rental Tallinn, Estonia",
    "car rental Vilnius, Lithuania"
  ]
  maxCrawledPlacesPerSearch: 30
  language: "en"
        │
        ▼  (export → scripts/raw/gmaps-rentals.json)
[Cursor agent]
  - filter big chains (Sixt, Hertz, Avis, Europcar, Enterprise,
    Budget, Alamo, National, Thrifty, Dollar, Buchbinder,
    Right Cars, Green Motion, Rentalcars, Discovercars)
  - filter non-rentals (dealerships, repair shops, parking lots)
  - infer vehicle_types[] from name
  - generate slug from name
        │
        ▼
[Cursor agent + browser MCP — enrichment loop]
  For each listing with a website:
    - navigate homepage + /about + /fleet + /cars
    - extract: fleet count estimate, vehicle types, services, languages
    - skip silently on broken/foreign/unparseable sites
        │
        ▼
[Supabase MCP execute_sql]
  - upsert into companies (status='unclaimed')
  - insert primary location row
  - insert company_amenities + company_fleet_summary if enriched
        │
        ▼
[Manual spot-check]
  - browse / and /<city>, sanity-scan 5 random profiles
  - drop any obviously wrong rows
```

## Big-chains filter (drop list)

Case-insensitive substring match on `name`:

```
sixt, hertz, avis, europcar, enterprise, budget, alamo, national,
thrifty, dollar, buchbinder, right cars, green motion, rentalcars,
discovercars, addcarrental, autoeurope, kayak, kemwel, fox rent,
keddy, firefly, surprice, payless, easirent, drivalia, megadrive,
goldcar, centauro, interrent
```

## Vehicle-type inference (heuristics from name + website)

| Keyword pattern (any case) | Adds |
| -------------------------- | ---- |
| `van`, `minivan`, `bus`, `transporter` | `van`, `nine_seater` |
| `electric`, `tesla`, `EV`, `hybrid` | `electric` |
| `SUV`, `crossover`, `4x4`, `Toureg`, `X5` | `suv` |
| (default if rental but no signal) | `economy`, `mid_size` |

If website lists specific models, a stronger inference is possible. Fall back
to `['economy', 'mid_size']` when nothing is signaled — almost every Baltic
rental has those.

## Legal / investor-defensible stance

1. All scraped listings ship as `unclaimed` (Yelp / Glassdoor / TripAdvisor
   model). Investors recognize the pattern instantly.
2. We use only public business info — name, address, business phone, public
   website. No emails. No copied marketing copy.
3. One-click claim or removal flow on the operator side. Takedowns honored
   within 24h.
4. GDPR: business contact data is not personal data under Art. 4(1).
5. No scraping of robots-disallowed pages. Google Maps via Apify is consented
   commercial data.

## What NOT to do

- Don't scrape competitor marketplaces (rentcars.com, discovercars.com etc.)
- Don't scrape personal email addresses
- Don't fabricate fleet sizes / descriptions for unclaimed listings
- Don't auto-generate `claim_tokens` — only when operators explicitly request
- Don't add a visible "scraped" badge — missing photos/details signal it
  naturally

## Re-running / refresh

The seed script is idempotent on `companies.slug`. To refresh:

```sql
-- delete only unclaimed scraped rows in a city
delete from public.companies
where city = 'riga' and status = 'unclaimed';
```

Then drop a new Apify JSON in `scripts/raw/` and ping the agent to re-seed.

## Design-partner anchors (verified, hand-curated)

Three Riga rentals are full design partners with hand-curated real data sourced
from their own websites via the browser MCP (not Apify). They pin to the top
of `/riga`, the homepage featured row, and any "verified operator" filter:

| slug | website | role |
| ---- | ------- | ---- |
| `baltic-car-rent` | balticcarrent.lv | Guntars's own rental — founder anchor for the pitch |
| `busrent` | busrent.lv | Vans, minibuses, tour buses (8–55 seats), trailers |
| `ecorent` | ecorent.lv | Multi-location: airport + 9 mall pickup points across Riga and Jūrmala |

To refresh their data, re-run the browser-MCP scrape against each website and
issue an UPDATE statement. Don't include them in re-scrapes from Apify
(`on conflict (slug) do nothing` protects them, but be careful).

## Open questions to revisit after pitch

- Should we run Apify weekly to catch new operators?
- Do we add a "rating" / "review_count" snapshot column? (signal of activity)
- Do we surface lat/lng on city pages (mini-map)?
