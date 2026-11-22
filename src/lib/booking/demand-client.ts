export type DemandPlace = {
  kind: "airport" | "city" | "office";
  code: string;
};

export type DemandInput = {
  citySlug: string;
  pickupDate: string;
  returnDate: string;
  pickupTime: string;
  returnTime: string;
  place?: DemandPlace;
};

const SESSION_KEY = "crd-demand-session";

function sessionId(): string {
  const existing = localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  localStorage.setItem(SESSION_KEY, created);
  return created;
}

/** One row per browser and city. A later search updates it. A refresh does not add a person. */
export async function recordDemand(input: DemandInput): Promise<void> {
  try {
    await fetch("/api/demand", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...input, sessionId: sessionId() }),
    });
  } catch {
    // Demand logging must not block the search.
  }
}

const recordedListings = new Set<string>();

/** One person per browser and rental page. A later open adds to the count. */
export function recordListingView(slug: string): void {
  if (!slug || recordedListings.has(slug)) return;
  recordedListings.add(slug);
  void fetch("/api/listing-view", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slug, sessionId: sessionId() }),
  }).catch(() => {
    // A missed page view must not affect the rental page.
  });
}
