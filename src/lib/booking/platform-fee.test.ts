import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { platformFee, quoteForDates, rentalDays, rentalTotal } from "./platform-fee";
import { isVehicleBlocked, rangesOverlap } from "./availability";

describe("platformFee", () => {
  it("uses the €19 minimum when 10% is smaller", () => {
    assert.equal(platformFee(190), 19);
    assert.equal(platformFee(0), 19);
    assert.equal(platformFee(100), 19);
  });

  it("uses 10% when that is above €19", () => {
    assert.equal(platformFee(380), 38);
    assert.equal(platformFee(200), 20);
  });

  it("rounds to cents", () => {
    assert.equal(platformFee(199.99), 20);
  });
});

describe("rentalDays", () => {
  it("counts exact 24h as one day", () => {
    const start = new Date("2026-11-03T10:00:00Z");
    const end = new Date("2026-11-08T10:00:00Z");
    assert.equal(rentalDays(start, end), 5);
  });

  it("starts a new day after 24h", () => {
    const start = new Date("2026-11-03T10:00:00Z");
    const end = new Date("2026-11-04T10:00:01Z");
    assert.equal(rentalDays(start, end), 2);
  });
});

describe("quoteForDates", () => {
  it("matches the 5-day €38 example", () => {
    const start = new Date("2026-11-03T10:00:00Z");
    const end = new Date("2026-11-08T10:00:00Z");
    const q = quoteForDates(38, start, end);
    assert.equal(q.days, 5);
    assert.equal(q.rentalTotal, 190);
    assert.equal(q.platformFee, 19);
  });
});

describe("availability", () => {
  it("detects overlapping ranges", () => {
    const a1 = new Date("2026-11-03T10:00:00Z");
    const a2 = new Date("2026-11-08T10:00:00Z");
    const b1 = new Date("2026-11-07T10:00:00Z");
    const b2 = new Date("2026-11-10T10:00:00Z");
    assert.equal(rangesOverlap(a1, a2, b1, b2), true);
    assert.equal(rangesOverlap(a1, a2, a2, b2), false);
  });

  it("ignores cancelled and expired pending_payment holds", () => {
    const start = new Date("2026-11-03T10:00:00Z");
    const end = new Date("2026-11-08T10:00:00Z");
    const now = new Date("2026-11-01T12:00:00Z");
    const bookings = [
      {
        id: "1",
        vehicle_id: "car-a",
        start_at: "2026-11-03T10:00:00Z",
        end_at: "2026-11-08T10:00:00Z",
        status: "cancelled",
      },
      {
        id: "2",
        vehicle_id: "car-a",
        start_at: "2026-11-03T10:00:00Z",
        end_at: "2026-11-08T10:00:00Z",
        status: "pending_payment",
        pending_expires_at: "2026-11-01T11:00:00Z",
      },
    ];
    assert.equal(isVehicleBlocked(bookings, "car-a", start, end, { now }), false);
  });

  it("blocks confirmed office bookings and live holds", () => {
    const start = new Date("2026-11-03T10:00:00Z");
    const end = new Date("2026-11-08T10:00:00Z");
    const now = new Date("2026-11-01T12:00:00Z");
    const bookings = [
      {
        id: "3",
        vehicle_id: "car-a",
        start_at: "2026-11-05T10:00:00Z",
        end_at: "2026-11-06T10:00:00Z",
        status: "confirmed",
      },
    ];
    assert.equal(isVehicleBlocked(bookings, "car-a", start, end, { now }), true);
    assert.equal(rentalTotal(38, 10), 380);
  });
});
