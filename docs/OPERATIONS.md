# CarRentDesk — Operations Platform: Full Functional Map

> Long-term reference. Describes the **complete vision** of the operator-facing platform.
> This is a feature universe, not a delivery plan.
> See [`PRODUCT.md`](./PRODUCT.md) for strategy and [`ROADMAP.md`](./ROADMAP.md) for what we actually build and when.

---

## Guiding Principle

Turn the rental owner from an **operator** (doing daily work) into a **business owner** (managing outcomes, not tasks).

| Before (operator mode) | After (owner mode) |
|---|---|
| Answers WhatsApp messages | Looks at dashboard |
| Checks Excel sheets | Sees profit per car |
| Argues about damage photos | Monitors utilization |
| Manually tracks cars | Only intervenes on exceptions |

Functions are grouped by **business outcome**, not by software module.

---

## 1. Demand & Revenue Generation

> Goal: make money happen without manual coordination.

### 1.1 Booking & reservation system

- Real-time availability calendar (per vehicle, per location)
- Manual booking entry (operator takes a phone/WhatsApp inquiry → enters in system)
- Online bookings (when ready)
- Quote generation (instant or custom)
- Deposit handling (later phase)
- Booking modifications (extend, shorten, cancel)
- Conflict detection (no double-bookings)

> Eliminates manual booking coordination.

### 1.2 Pricing & revenue control

- Daily pricing per vehicle
- Seasonal pricing rules
- Weekend / holiday multipliers
- Long-term rental discounts
- Manual override pricing
- Bulk pricing edits across fleet

> Owner controls revenue without micromanaging each deal.

### 1.3 Channel management (later)

- Sync availability with marketplace listings
- Prevent double bookings across channels
- Unified availability source of truth

> Avoids fragmented inventory management.

---

## 2. Fleet Management (core asset control)

### 2.1 Vehicle database

- Car profiles: VIN, plates, specs, photos, registration
- Status tracking: `available`, `rented`, `maintenance`, `damaged`, `retired`
- Document storage per vehicle (registration, insurance, technical inspection)

### 2.2 Utilization tracking (critical for profit)

- Utilization rate per vehicle (% of days rented)
- Revenue per vehicle (gross & net)
- Downtime tracking (maintenance days, idle days)
- Profitability per vehicle

> Owner sees which cars actually make money.

### 2.3 Maintenance management

- Service schedules (per vehicle, per mileage / time interval)
- Maintenance reminders / alerts
- Repair logs
- Cost tracking per vehicle (parts + labor)
- Service provider records

> Prevents silent profit leakage from poor maintenance planning.

---

## 3. Customer Management (CRM Light)

### 3.1 Customer database

- Customer profiles (name, contact, license)
- Rental history per customer
- ID / driver license storage (per rental company's internal records)
- Notes (damage behavior, preferences, language, blacklist flag)

### 3.2 Communication history

- All messages linked to booking and customer
- WhatsApp / email logs (via integration, later phase)
- Call notes (manual entry)

> No lost context between rentals.

### 3.3 Customer segmentation (later)

- Frequent renters
- High-risk renters (history of damage / late returns)
- Corporate clients
- Repeat-rate / lifetime-value calculation

---

## 4. Inspection & Damage Control (highest-pain module)

> This is the **MVP wedge**. See ROADMAP Phase 3.

### 4.1 Vehicle inspection system

- Before / after rental inspections
- Photo-based documentation
- Damage tagging on vehicle silhouette / photos
- Timestamp + GPS verification (optional)
- Inspector identity recorded
- Mobile-first capture (phone in parking lot)

### 4.2 Damage dispute prevention system

- Side-by-side photo comparison (pickup vs return)
- "New vs existing damage" separation
- Immutable audit trail per rental
- PDF export for customer / insurance

> Directly replaces WhatsApp + manual arguing about damage.

### 4.3 Damage cost tracking

- Repair estimates per damage entry
- Deposits deducted (future phase, requires deposit handling)
- Historical damage per vehicle (lifetime damage cost)
- Damage frequency by customer segment

> Makes losses visible and controlled.

---

## 5. Operations Automation (remove daily operator role)

### 5.1 Rental workflow engine

A structured pipeline that the operator follows for every rental:

1. Booking created
2. Customer assigned
3. Vehicle assigned
4. Pickup inspection
5. Rental active
6. Return inspection
7. Close + invoice

> System guides the flow. Owner doesn't manage chaos manually.

### 5.2 Task system (internal operations)

- Tasks assignable to staff: clean car, deliver vehicle, pick up vehicle, inspect, refuel
- Status tracking (assigned / in progress / done)
- Linked to specific bookings or vehicles
- Daily task list view per staff member

### 5.3 Notifications & alerts

- Overdue returns
- Upcoming bookings (today / tomorrow)
- Maintenance due (per mileage or date)
- New damage detected on inspection
- Low fleet availability

---

## 6. Financial Control (operations → profit visibility)

### 6.1 Revenue tracking

- Revenue per day / week / month / year
- Revenue per vehicle
- Revenue per customer
- Revenue by location (when multi-location enabled)

### 6.2 Cost tracking

- Maintenance costs
- Cleaning costs
- Damage costs (operator-paid portion)
- Operational expenses (manual entry, optional)
- Cost per vehicle (rolled up)

### 6.3 Profit dashboard (key outcome layer)

- Net profit per vehicle
- Fleet profitability ranking (best → worst)
- Idle capital (cars with low utilization or low margin)
- Trend lines over time

> This is what turns the owner into a strategist.

---

## 7. Sales & Growth Layer

### 7.1 Marketplace integration

- Public listing pages (managed via marketplace, see PRODUCT.md §3.1)
- Lead generation from marketplace inquiries
- Visibility score vs competitors in the same city

### 7.2 Lead management

- Inquiry inbox (from marketplace contact clicks, future contact form)
- Conversion tracking (inquiry → booking)
- Lead source attribution (marketplace, direct, referral)

### 7.3 Conversion tools

- Fast quote generation
- Pre-filled offers from inquiry data
- One-click conversion: inquiry → booking

---

## 8. Trust, Compliance & Risk Control

### 8.1 Document management

- Driver license storage (operator-side, not customer-facing marketplace)
- Rental agreement storage
- Insurance documents per vehicle
- Document expiry alerts

### 8.2 Risk scoring (advanced, later)

- Customer risk profile based on rental history
- Damage likelihood indicators
- Late-return likelihood
- Manual blacklist flag

---

## 9. Multi-location & Scaling Support

- Multiple rental locations per company
- Shared fleet view across locations
- Branch-level performance tracking
- Inter-branch vehicle transfers
- Per-location pricing

---

## The Real Moat

The strongest long-term defensibility is:

> Once inspections, customers, and fleet history live here — switching becomes operationally painful.

The compounding effect:

1. **Marketplace** brings users in (low friction, free signal of value)
2. **Operations system** locks them in (daily-use habit, accumulated data)
3. **Data history** makes leaving irrational (years of inspections, customer records, damage history, profit analytics)

Every category in this document deepens that moat. Prioritization (in ROADMAP.md) is therefore **moat-first**: build the features that accumulate the most irreplaceable data fastest.

---

## How this document is used

- **ROADMAP.md** pulls items from here into delivery phases.
- **PRODUCT.md** sets the strategic boundary — anything in here that contradicts strategy is out of scope.
- **No item in this document is committed** until it appears in ROADMAP.md.
- New ideas → add here first, decide later if/when to roadmap them.
