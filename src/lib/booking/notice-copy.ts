import { formatEur } from "@/lib/booking/money";

export type BookingNotice = {
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  companyName: string;
  companyPhone: string | null;
  carPublic: string;
  carOffice: string;
  plate: string | null;
  pickup: string;
  returnAt: string;
  pickupPlace: string | null;
  returnPlace: string | null;
  flight: string | null;
  request: string | null;
  rentalTotal: number;
  deposit: number | null;
  fee: number;
  cancelUrl: string;
  officeUrl: string;
  /** True when the customer cancelled. False when the rental cancelled. */
  customerCancelled?: boolean;
};

export type NoticeLetter = { subject: string; text: string };

function depositSentence(deposit: number | null): string {
  if (deposit == null || deposit <= 0) return "Deposit at pickup: none.";
  return `Deposit at pickup: ${formatEur(deposit)}.`;
}

function tripLines(notice: BookingNotice, places: boolean): string[] {
  return [
    `Pickup: ${notice.pickup}`,
    `Return: ${notice.returnAt}`,
    places && notice.pickupPlace ? `Pickup place: ${notice.pickupPlace}` : null,
    places && notice.returnPlace ? `Return place: ${notice.returnPlace}` : null,
    notice.flight ? `Flight: ${notice.flight}` : null,
  ].filter((line): line is string => Boolean(line));
}

/** Customer confirmation. Includes the confirmation fee and the cancel link. */
export function customerConfirmedCopy(notice: BookingNotice): NoticeLetter {
  const phone = notice.companyPhone ? ` Phone: ${notice.companyPhone}.` : "";
  const lines = [
    `${notice.carPublic} is booked with ${notice.companyName}.${phone}`,
    ``,
    ...tripLines(notice, true),
    notice.request ? `Your request: ${notice.request}` : null,
    ``,
    `Paid now: ${formatEur(notice.fee)}`,
    `This is the confirmation fee. It is not a deposit and it is not the rental.`,
    `Pay at pickup: ${formatEur(notice.rentalTotal)} to ${notice.companyName}.`,
    depositSentence(notice.deposit),
    ``,
    `To cancel, open this link. The confirmation fee is not returned:`,
    notice.cancelUrl,
    ``,
    `If ${notice.companyName} cannot provide a car, the confirmation fee is refunded to your card.`,
    ``,
    `— CarRentDesk`,
  ].filter((line): line is string => line !== null);
  return {
    subject: `Booking confirmed — ${notice.carPublic} — ${notice.companyName}`,
    text: lines.join("\n"),
  };
}

/** Rental confirmation. The confirmation fee is not included. */
export function rentalConfirmedCopy(notice: BookingNotice): NoticeLetter {
  const lines = [
    `Hi ${notice.companyName},`,
    ``,
    `You have a new booking.`,
    ``,
    `Car: ${notice.carOffice}`,
    notice.plate ? `Plate: ${notice.plate}` : null,
    ``,
    ...tripLines(notice, true),
    notice.request ? `Request: ${notice.request}` : null,
    ``,
    `Customer: ${notice.customerName}`,
    `Phone: ${notice.customerPhone}`,
    notice.customerEmail ? `Email: ${notice.customerEmail}` : null,
    ``,
    `Collect at pickup: ${formatEur(notice.rentalTotal)}`,
    depositSentence(notice.deposit),
    ``,
    `Open the booking:`,
    notice.officeUrl,
    ``,
    notice.customerEmail
      ? `Reply to this email to reach ${notice.customerName}.`
      : `Call the customer on ${notice.customerPhone}.`,
    ``,
    `— CarRentDesk`,
  ].filter((line): line is string => line !== null);
  return {
    subject: `New booking — ${notice.carOffice} — ${notice.pickup}`,
    text: lines.join("\n"),
  };
}

/** Customer cancellation notice. Says whether the fee was refunded. */
export function customerCancelledCopy(notice: BookingNotice): NoticeLetter {
  const refunded = !notice.customerCancelled;
  const lines = [
    notice.customerCancelled
      ? `Your booking of ${notice.carPublic} with ${notice.companyName} is cancelled.`
      : `${notice.companyName} cancelled your booking of ${notice.carPublic}.`,
    ``,
    ...tripLines(notice, false),
    ``,
    refunded
      ? `The confirmation fee of ${formatEur(notice.fee)} is refunded to your card.`
      : `The confirmation fee of ${formatEur(notice.fee)} is not returned.`,
    ``,
    `— CarRentDesk`,
  ];
  return {
    subject: `Booking cancelled — ${notice.carPublic}`,
    text: lines.join("\n"),
  };
}

/** Rental cancellation notice. No confirmation fee and no amount charged by CarRentDesk. */
export function rentalCancelledCopy(notice: BookingNotice): NoticeLetter {
  const lines = [
    `Hi ${notice.companyName},`,
    ``,
    notice.customerCancelled
      ? `${notice.customerName} cancelled this booking.`
      : `This booking is cancelled.`,
    ``,
    `Car: ${notice.carOffice}`,
    notice.plate ? `Plate: ${notice.plate}` : null,
    `Customer: ${notice.customerName}`,
    `Phone: ${notice.customerPhone}`,
    ``,
    ...tripLines(notice, false),
    ``,
    `Open the booking:`,
    notice.officeUrl,
    ``,
    `— CarRentDesk`,
  ].filter((line): line is string => line !== null);
  return {
    subject: `Booking cancelled — ${notice.carOffice} — ${notice.pickup}`,
    text: lines.join("\n"),
  };
}
