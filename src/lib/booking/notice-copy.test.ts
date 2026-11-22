import assert from "node:assert/strict";
import test from "node:test";
import {
  customerCancelledCopy,
  customerConfirmedCopy,
  rentalCancelledCopy,
  rentalConfirmedCopy,
  type BookingNotice,
} from "./notice-copy";

const notice: BookingNotice = {
  customerName: "Ada Driver",
  customerEmail: "ada@example.com",
  customerPhone: "+37120000000",
  companyName: "Baltic Car Rent",
  companyPhone: "+37120000001",
  carPublic: "Volvo S60 or similar",
  carOffice: "Volvo S60 2006",
  plate: "OL1818",
  pickup: "14 Nov 2026, 08:00",
  returnAt: "17 Nov 2026, 08:00",
  pickupPlace: "Riga Airport (RIX)",
  returnPlace: "Riga Airport (RIX)",
  flight: "JKLFDS",
  request: "A child seat, please",
  rentalTotal: 105,
  deposit: 500,
  fee: 19,
  cancelUrl: "https://carrentdesk.com/book/cancel/token",
  officeUrl: "https://carrentdesk.com/app/rentals/company/booking",
};

test("the rental confirmation leaves out the confirmation fee", () => {
  const letter = rentalConfirmedCopy(notice);
  const combined = `${letter.subject}\n${letter.text}`.toLowerCase();
  assert.equal(combined.includes("19"), false);
  assert.equal(combined.includes("confirmation fee"), false);
  assert.equal(combined.includes("platform"), false);
  assert.match(letter.text, /OL1818/);
  assert.match(letter.text, /€105/);
  assert.match(letter.text, /€500/);
  assert.match(letter.text, /A child seat, please/);
});

test("the customer confirmation includes the fee and the cancel link", () => {
  const letter = customerConfirmedCopy(notice);
  assert.match(letter.text, /€19/);
  assert.match(letter.text, /not a deposit/);
  assert.match(letter.text, /https:\/\/carrentdesk.com\/book\/cancel\/token/);
  assert.equal(letter.text.includes("OL1818"), false);
});

test("a rental cancellation notice still hides the fee", () => {
  const letter = rentalCancelledCopy({ ...notice, customerCancelled: true });
  const combined = `${letter.subject}\n${letter.text}`.toLowerCase();
  assert.equal(combined.includes("19"), false);
  assert.equal(combined.includes("confirmation fee"), false);
  assert.equal(combined.includes("€"), false);
  assert.match(letter.text, /Ada Driver cancelled/);
});

test("the customer is told when the fee stays and when it is refunded", () => {
  const kept = customerCancelledCopy({ ...notice, customerCancelled: true });
  const refunded = customerCancelledCopy({ ...notice, customerCancelled: false });
  assert.match(kept.text, /€19/);
  assert.match(kept.text, /not returned/);
  assert.match(refunded.text, /refunded to your card/);
});
