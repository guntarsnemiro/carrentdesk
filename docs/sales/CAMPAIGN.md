# Sales outreach campaign — Jul 2026

## Source of truth for the target list

**Rank companies by Google Search Console clicks (last 28 days)** on their `/c/[slug]` page.

- **Do NOT** rank by marketplace status, verified badge, city listing count, or “best ranked” in the product.
- **Do NOT** invent click numbers.
- Regenerate the list: `node scripts/build-outreach-queue.mjs`
- Master file: **`outreach-queue.csv`** in this folder

GSC export used: `carrentdesk.com-Performance-on-Search-2026-07-26.xlsx` (sheet **Pages**, filter `/c/` URLs).

---

## Offer (first message = claim only)

1. **Free claim** + verified badge  
2. They already have traffic — quote **`gsc_clicks_28d`** from CSV  
3. Link: `https://carrentdesk.com/c/[slug]` and `https://carrentdesk.com/join`  
4. **No commission** on bookings  

**Message 2 (if interested):** ops platform from €29/mo, shared blacklist, 14-day trial.

---

## Logging (tell the AI in chat)

```
LOG | [slug] | whatsapp | msg1_sent | no reply
LOG | [slug] | whatsapp | replied | asked price
FOLLOWUP | [slug] | 2026-07-30 | msg2
```

Update **`campaign_stage`** in CSV: `queued` → `contacted` → `replied` → `interested` → `trial` → `dead`

---

## Weekly KPIs (4-week target)

| Metric | Target |
|--------|--------|
| Contacted | 50 |
| Replied | 12–15 |
| Interested | 5–6 |
| Trial / claimed | 3–5 |

---

## WhatsApp template (Tier A)

> Hi! I'm Guntars from **CarRentDesk** — we list independent car rentals in Europe.  
>  
> **[Company name]** is already listed: https://carrentdesk.com/c/[slug]  
>  
> About **[X] people clicked your page from Google** last month.  
>  
> You can **claim it free** and get a Verified badge: https://carrentdesk.com/join  
>  
> No commission on bookings. Happy to help on WhatsApp.

Replace **[X]** with `gsc_clicks_28d` from CSV.

---

## For AI assistants

When working on sales in any chat:

1. Read **`docs/sales/outreach-queue.csv`** only — not generic “top companies” from the DB.  
2. Sort is already by **`rank_gsc_clicks`**.  
3. Never rebuild the list from a different ranking unless the user asks to regenerate from GSC.
