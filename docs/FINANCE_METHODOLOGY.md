# CarRentDesk — Finance Module Methodology

**Prepared for external review · May 2026**

This document describes how the CarRentDesk operations platform calculates revenue, costs, and profit for car rental operators. The goal is management-level P&L reporting — not statutory accounting — but the methods are based on standard accrual accounting principles.

---

## 1. Revenue recognition — pro-rata (accrual basis)

Revenue is recognised **by the day the car is rented out**, not by the date payment is received.

### Formula

```
daily_rate = booking_price / total_rental_days
monthly_revenue = daily_rate × days_overlapping_with_that_month
```

### Example

| Booking | Price | Period | May revenue | June revenue |
|---------|-------|--------|-------------|--------------|
| Customer A | €900 | 1 Jun – 30 Jun (30 days) | €0 | €900 |
| Customer B | €600 | 20 May – 19 Jun (30 days) | €240 (12 days) | €360 (18 days) |

This prevents distortion from long bookings paid upfront and gives a true picture of how much was earned each month.

### What is NOT used for revenue

- **Payment date** — tracked separately for cash flow analysis
- **Booking creation date** — irrelevant for earnings
- **Booking start date** — only used as the beginning of the rental period

---

## 2. Cost recognition — two methods

### 2a. Point-in-time costs (cash basis)

Regular operational costs are booked in the **month the invoice is paid**:

- Oil changes, tyre replacement, repairs
- Monthly salaries
- Phone and internet bills
- Ad hoc purchases

### 2b. Amortized / period costs (accrual basis)

Large costs that **cover a future period** are spread daily across that period:

```
daily_cost = total_amount / coverage_days
monthly_cost = daily_cost × days_overlapping_with_that_month
```

Applies to:
- **Vehicle insurance** — e.g. €1,200 paid January, covers Jan–Dec → €100/month
- **Annual government fees / road tax**
- **Company liability insurance**
- **Annual software licences, memberships**

The operator marks a cost as "amortized" and sets the coverage period (covers_from / covers_until). If no coverage period is set, the full cost falls in the payment month.

---

## 3. Depreciation — straight-line method

Depreciation is calculated per vehicle on a **straight-line basis**.

### Formula

```
depreciable_amount = purchase_price − residual_value
monthly_depreciation = depreciable_amount × (annual_rate / 100) / 12
```

### Inputs per vehicle

| Field | Description |
|-------|-------------|
| Purchase price | Original purchase price OR current market value estimate |
| Purchase date | Date of purchase OR date of valuation (for existing fleet) |
| Depreciation rate | % per year (default: 20%, operator-configurable per vehicle) |
| Residual value | Optional — expected sale price at end of useful life |

### Default rate

The operator sets a company-wide default rate (default: 20%/year). Individual vehicles can override this. The 20% rate implies a 5-year useful life to zero book value (or to residual value if set).

### Partial months

If a vehicle is purchased or disposed of mid-month, depreciation is pro-rated by the number of active days in that month.

### Depreciation is a non-cash charge

It does not affect the cash position widget — it is used only in the P&L to reflect the wearing down of the asset.

---

## 4. Vehicle disposal — gain or loss

When a vehicle is sold or written off, a **one-time disposal gain or loss** is posted to the month of disposal.

```
book_value_at_disposal = purchase_price − (monthly_depreciation × months_since_purchase)
disposal_gain_loss = actual_sale_price − book_value_at_disposal
```

- **Positive** = gain (car sold for more than book value) — posted as one-time revenue
- **Negative** = loss (car sold below book value, or written off) — posted as one-time cost

For insurance write-offs: the insurance payout is entered as the disposal price, and the net gain/loss reflects the difference between payout and book value.

---

## 5. Cash position — three buckets

Separate from the P&L, the platform tracks the real cash position at any point in time:

| Bucket | Description |
|--------|-------------|
| **Earned (mine)** | Net profit accumulated over last 12 months |
| **Deferred revenue** | Money received but rental days not yet passed — legally a liability |
| **Deposits held** | Customer security deposits not yet returned — liability, must be returned |

**Deferred revenue** = for each booking with a payment date set, the unearned portion (future days × daily rate) is calculated as of today.

**Deposits held** = sum of all deposit amounts where the return date has not been recorded.

---

## 6. P&L structure

The monthly P&L table shows six columns:

| Column | Description |
|--------|-------------|
| Revenue | Pro-rata earned (method 1) |
| Cash costs | Amortized maintenance + business expenses (method 2) |
| **EBITDA** | Revenue − Cash costs |
| Depreciation | Straight-line per car (method 3) |
| Disposal G/L | One-time gain/loss on vehicle sales (method 4) |
| **Net profit** | EBITDA − Depreciation + Disposal G/L |

**EBITDA** (Earnings Before Interest, Taxes, Depreciation and Amortisation) is shown separately because it represents the cash-generating ability of the business — the metric most commonly used in business valuations.

**Net profit** gives the true accounting result after accounting for asset depreciation.

---

## 7. Fleet profitability

Each vehicle's contribution is calculated over the last 12 months:

```
net_contribution = vehicle_revenue − vehicle_direct_costs − vehicle_depreciation
```

- **Vehicle revenue** = pro-rata earnings from all bookings for that vehicle
- **Vehicle direct costs** = amortized maintenance costs assigned to that vehicle
- **Vehicle depreciation** = monthly depreciation × 12 months

This allows the operator to identify which cars are profitable and which are costing more than they earn.

---

## 8. What this does NOT cover

The following are **outside scope** for this management reporting tool:

- VAT / sales tax calculation or filing
- Statutory financial statements (balance sheet, formal income statement)
- Payroll tax calculations
- Lease / financing cost treatment (hire purchase interest, etc.)
- Multi-currency support

These remain the responsibility of the operator's accountant or accounting software (e.g. Brīvais, iSkaits, or similar).

---

## 9. Data inputs required for full accuracy

| Feature | Required input |
|---------|---------------|
| Pro-rata revenue | Booking start/end dates + total price |
| Cash collection tracking | Payment date per booking |
| Deposit tracking | Deposit amount + return date |
| Cost amortization | Coverage period (from/until) on insurance, annual fees |
| Depreciation | Purchase price + purchase date per vehicle |
| Disposal G/L | Disposal date + sale/payout price per vehicle |

All fields are optional — the system degrades gracefully. If a vehicle has no purchase data, depreciation is simply not calculated for that vehicle, and the P&L shows a note.

---

*CarRentDesk · Internal methodology document · Not for statutory reporting purposes*
