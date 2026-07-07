import type { City } from "@/lib/cities";

export type Intent = {
  /** URL slug segment, e.g. "best-car-rentals" */
  slug: string;
  /** Whether this intent requires the city to have an airport */
  requiresAirport: boolean;
  /** Page title (H1). Receives city name + year. */
  h1: (city: City, year: number) => string;
  /** <title> tag */
  metaTitle: (city: City, year: number) => string;
  /** Meta description */
  metaDescription: (city: City) => string;
  /** Short intro paragraph below the H1 */
  intro: (city: City) => string;
  /** Why local beats the big chains — adapted per intent */
  whyLocal: (city: City) => string;
  /** FAQ items — each fully adapted to city + intent */
  faqs: (city: City) => { q: string; a: string }[];
};

const YEAR = new Date().getFullYear();

export const INTENTS: Intent[] = [
  // ── 1. Best ────────────────────────────────────────────────────
  {
    slug: "best-car-rentals",
    requiresAirport: false,
    h1: (c, y) => `Best Car Rentals in ${c.name} ${y}`,
    metaTitle: (c, y) => `Best Car Rentals in ${c.name} ${y}`,
    metaDescription: (c) =>
      `Find the best car rental companies in ${c.name}. Verified local operators, fair prices, direct contact — no middleman fees.`,
    intro: (c) =>
      `Looking for the best car rental in ${c.name}? We've listed verified local operators who offer direct booking, transparent pricing, and no hidden platform fees. Skip the big chains and rent from people who know ${c.name}.`,
    whyLocal: (c) =>
      `Local rental companies in ${c.name} consistently offer better value than international chains — flexible pickup times, no mandatory add-ons, and someone you can actually call if something goes wrong.`,
    faqs: (c) => [
      {
        q: `What is the best car rental company in ${c.name}?`,
        a: `The best car rental in ${c.name} depends on your needs. Local operators on CarRentDesk are verified, have direct contact options, and often offer better rates than Hertz, Sixt, or Europcar for multi-day rentals.`,
      },
      {
        q: `How much does car rental cost in ${c.name}?`,
        a: `Car rental in ${c.name} typically starts from ${c.currency === "EUR" ? "€25–40" : c.currency === "SEK" ? "300–500 SEK" : c.currency === "NOK" ? "350–600 NOK" : c.currency === "DKK" ? "250–450 DKK" : c.currency === "ISK" ? "8,000–15,000 ISK" : "€25–40"} per day for a compact car. Rates vary by season and vehicle type.`,
      },
      {
        q: `Is it cheaper to rent a car in ${c.name} from a local company?`,
        a: `Yes, local companies in ${c.name} typically charge 15–30% less than international chains, and they rarely push unnecessary insurance add-ons.`,
      },
      {
        q: `Do I need a credit card to rent a car in ${c.name}?`,
        a: `Most rental companies in ${c.name} require a credit card for the deposit. Some local operators accept debit cards — check individual listings for their policy.`,
      },
      {
        q: `Can I rent a car in ${c.name} without a reservation?`,
        a: `Walk-in rentals are sometimes possible, but availability is limited — especially in summer. We recommend booking at least a day in advance through CarRentDesk.`,
      },
    ],
  },

  // ── 2. Top ─────────────────────────────────────────────────────
  {
    slug: "top-car-rentals",
    requiresAirport: false,
    h1: (c, y) => `Top Car Rentals in ${c.name} ${y}`,
    metaTitle: (c, y) => `Top Car Rentals in ${c.name} ${y}`,
    metaDescription: (c) =>
      `Discover top-rated car rental companies in ${c.name}. Compare verified local operators with real reviews and direct booking.`,
    intro: (c) =>
      `Here are the top car rental companies in ${c.name} — verified local operators with transparent pricing and direct customer contact. No booking fees, no hidden extras.`,
    whyLocal: (c) =>
      `Top-rated local car rentals in ${c.name} offer something the big chains can't: flexibility. Need a late pickup, an extra day, or a child seat last minute? A local operator in ${c.name} will work with you.`,
    faqs: (c) => [
      {
        q: `Which car rental companies are top-rated in ${c.name}?`,
        a: `CarRentDesk lists verified local operators in ${c.name} with real customer contacts. All listed companies have been reviewed for reliability and transparency.`,
      },
      {
        q: `How do I find top car rentals in ${c.name}?`,
        a: `Browse listings on CarRentDesk for ${c.name}, compare prices and vehicle types, and contact the rental company directly — no middleman markup.`,
      },
      {
        q: `Are local car rentals in ${c.name} reliable?`,
        a: `Yes. Local operators on CarRentDesk are verified businesses. You get direct contact details — phone, WhatsApp, or email — so you always know who you're dealing with.`,
      },
      {
        q: `What types of cars can I rent in ${c.name}?`,
        a: `Local companies in ${c.name} offer everything from compact city cars and SUVs to minivans and premium vehicles. Filter by type on the ${c.name} listings page.`,
      },
      {
        q: `How do CarRentDesk rentals compare to Sixt or Hertz in ${c.name}?`,
        a: `Local operators on CarRentDesk tend to offer more flexible terms, lower rates, and better customer service than Sixt or Hertz in ${c.name}. You deal directly with the owner, not a call centre.`,
      },
    ],
  },

  // ── 3. Cheap ───────────────────────────────────────────────────
  {
    slug: "cheap-car-rentals",
    requiresAirport: false,
    h1: (c, y) => `Cheap Car Rentals in ${c.name} ${y}`,
    metaTitle: (c, y) => `Cheap Car Rentals in ${c.name} ${y}`,
    metaDescription: (c) =>
      `Find cheap car rentals in ${c.name} from verified local companies. Beat Sixt and Hertz prices — direct booking, no platform fees.`,
    intro: (c) =>
      `Want cheap car rental in ${c.name} without compromising on quality? Local operators on CarRentDesk offer competitive daily rates, direct booking, and no platform surcharges — so more of your money goes toward the actual car.`,
    whyLocal: (c) =>
      `International chains in ${c.name} often advertise low rates that balloon with mandatory insurance, young driver fees, and fuel policies. Local operators are more transparent — the price you see is usually the price you pay.`,
    faqs: (c) => [
      {
        q: `What is the cheapest car rental in ${c.name}?`,
        a: `Budget car rentals in ${c.name} start from around ${c.currency === "EUR" ? "€20–30" : c.currency === "SEK" ? "250–400 SEK" : c.currency === "NOK" ? "300–500 NOK" : c.currency === "DKK" ? "200–350 DKK" : c.currency === "ISK" ? "6,000–12,000 ISK" : "€20–30"} per day from local operators. Prices vary by season.`,
      },
      {
        q: `How can I get a cheaper car rental in ${c.name}?`,
        a: `Book directly with a local operator in ${c.name} via CarRentDesk to avoid platform markup. Multi-day or weekly rentals also unlock better rates.`,
      },
      {
        q: `Is it cheaper to rent a car in ${c.name} for a week?`,
        a: `Weekly rates in ${c.name} typically offer a 20–30% discount versus day rates. Contact operators directly to negotiate — local companies are more flexible.`,
      },
      {
        q: `Are cheap car rentals in ${c.name} safe?`,
        a: `All companies listed on CarRentDesk are verified businesses with proper licenses. Cheap doesn't mean unreliable — local operators build their business on reputation, not call-centre volume.`,
      },
      {
        q: `Do budget car rentals in ${c.name} include insurance?`,
        a: `Most local operators in ${c.name} include third-party insurance as standard. Check individual listings — some also offer full-coverage options at an extra daily rate.`,
      },
    ],
  },

  // ── 4. Long-term ───────────────────────────────────────────────
  {
    slug: "long-term-car-rental",
    requiresAirport: false,
    h1: (c, y) => `Long-Term Car Rental in ${c.name} ${y}`,
    metaTitle: (c, y) => `Long-Term Car Rental in ${c.name} ${y}`,
    metaDescription: (c) =>
      `Monthly and long-term car rental in ${c.name}. Local operators with flexible contracts — better rates than short-term hire.`,
    intro: (c) =>
      `Need a car in ${c.name} for a month or longer? Local operators on CarRentDesk offer flexible long-term rental agreements — no leasing commitment, no dealership paperwork. Just a car when you need it.`,
    whyLocal: (c) =>
      `For stays longer than a week in ${c.name}, local rental companies almost always beat international chains on price. They're also more flexible on contract length, mileage, and vehicle swaps.`,
    faqs: (c) => [
      {
        q: `Can I rent a car long-term in ${c.name}?`,
        a: `Yes. Several local operators in ${c.name} offer weekly and monthly rental contracts. Contact them directly via CarRentDesk to discuss terms.`,
      },
      {
        q: `How much does monthly car rental cost in ${c.name}?`,
        a: `Monthly car rental in ${c.name} typically costs ${c.currency === "EUR" ? "€600–1,200" : c.currency === "SEK" ? "7,000–15,000 SEK" : c.currency === "NOK" ? "8,000–18,000 NOK" : c.currency === "DKK" ? "5,500–12,000 DKK" : c.currency === "ISK" ? "150,000–350,000 ISK" : "€600–1,200"} depending on the vehicle class, often 30–40% cheaper than short-term daily rates.`,
      },
      {
        q: `Is long-term car rental cheaper than leasing in ${c.name}?`,
        a: `For stays under 12 months, long-term rental in ${c.name} is often more cost-effective than a lease — no down payment, no insurance setup, and you can end the rental when needed.`,
      },
      {
        q: `What documents do I need for long-term car rental in ${c.name}?`,
        a: `You'll typically need a valid driver's license, passport or ID, and a payment method for the deposit. Requirements vary by operator — check individual listings.`,
      },
      {
        q: `Can I rent a car in ${c.name} for 3–6 months?`,
        a: `Yes, several operators in ${c.name} offer flexible medium-term contracts. Contact them directly — rates improve significantly for longer commitments.`,
      },
    ],
  },

  // ── 5. No credit card ──────────────────────────────────────────
  {
    slug: "car-rental-no-credit-card",
    requiresAirport: false,
    h1: (c, y) => `Car Rental in ${c.name} Without Credit Card ${y}`,
    metaTitle: (c, y) => `Car Rental ${c.name} No Credit Card ${y}`,
    metaDescription: (c) =>
      `Rent a car in ${c.name} without a credit card. Find local operators who accept debit cards or cash deposits — direct booking.`,
    intro: (c) =>
      `No credit card? You can still rent a car in ${c.name}. Some local operators accept debit cards or bank transfers for the security deposit. Browse listings below and contact operators directly to confirm their payment requirements.`,
    whyLocal: (c) =>
      `Big chains in ${c.name} almost universally require a credit card. Local operators are far more flexible — many accept debit cards, Revolut, or bank transfer deposits. Always confirm directly before booking.`,
    faqs: (c) => [
      {
        q: `Can I rent a car in ${c.name} with a debit card?`,
        a: `Some local operators in ${c.name} accept debit cards for the deposit. Contact listings directly via CarRentDesk to confirm — this policy varies by company.`,
      },
      {
        q: `Which car rental companies in ${c.name} don't require a credit card?`,
        a: `Local operators on CarRentDesk tend to be more flexible than international chains. Contact them directly to ask about debit card or bank transfer options.`,
      },
      {
        q: `Can I pay cash for car rental in ${c.name}?`,
        a: `Some operators in ${c.name} accept cash for the deposit, though this is less common. Ask the rental company directly — local businesses often have more flexible policies.`,
      },
      {
        q: `Is a larger deposit required without a credit card in ${c.name}?`,
        a: `Yes, operators who accept debit cards in ${c.name} may require a higher deposit amount. This varies by company and vehicle value — confirm upfront.`,
      },
      {
        q: `Can I use Revolut or N26 to rent a car in ${c.name}?`,
        a: `Some local operators in ${c.name} accept digital bank cards including Revolut. Check with individual companies — many are open to it for the rental payment, though the deposit may still require a traditional bank card.`,
      },
    ],
  },

  // ── 6. Turo alternative ────────────────────────────────────────
  {
    slug: "turo-alternative",
    requiresAirport: false,
    h1: (c, y) => `Turo Alternative in ${c.name} ${y}`,
    metaTitle: (c, y) => `Turo Alternative ${c.name} ${y}`,
    metaDescription: (c) =>
      `Looking for a Turo alternative in ${c.name}? CarRentDesk connects you with verified local car rental companies — lower fees, direct contact.`,
    intro: (c) =>
      `Turo isn't widely available in ${c.name} — and even where it is, platform fees can add 20–35% to the sticker price. CarRentDesk connects you directly with local rental companies in ${c.name}: no peer-to-peer uncertainty, no hidden service charges.`,
    whyLocal: (c) =>
      `Unlike Turo's peer-to-peer model, local rental companies in ${c.name} on CarRentDesk are registered businesses with proper insurance, vehicle maintenance standards, and a real number to call. You get the flexibility of Turo with the reliability of a professional operator.`,
    faqs: (c) => [
      {
        q: `Is Turo available in ${c.name}?`,
        a: `Turo has limited availability in ${c.name} and ${c.country}. CarRentDesk is a local alternative that connects you with professional rental companies directly.`,
      },
      {
        q: `What is a good Turo alternative in ${c.name}?`,
        a: `CarRentDesk is the leading marketplace for local car rentals in ${c.name}. Unlike Turo, all listed companies are professional operators — not private individuals.`,
      },
      {
        q: `Why choose CarRentDesk over Turo in ${c.name}?`,
        a: `CarRentDesk charges no booking platform fee — you contact the rental company directly. Turo adds a 15–35% service fee on top of the listed price and provides peer-to-peer rentals with variable quality.`,
      },
      {
        q: `Are there peer-to-peer car rentals in ${c.name}?`,
        a: `Peer-to-peer car rental platforms like Turo have limited presence in ${c.country}. CarRentDesk instead lists professional local operators who offer consistent service and proper insurance.`,
      },
      {
        q: `How does CarRentDesk compare to Turo?`,
        a: `CarRentDesk is a directory of verified professional rental companies, not a peer-to-peer platform. There are no platform booking fees — you deal directly with the company. This typically means lower total cost and more reliable service than Turo.`,
      },
    ],
  },

  // ── 7. Airport ─────────────────────────────────────────────────
  {
    slug: "airport-car-rental",
    requiresAirport: true,
    h1: (c, y) => `${c.name} Airport Car Rental ${y}`,
    metaTitle: (c, y) =>
      `${c.name} Airport Car Rental ${y}${c.airport ? ` (${c.airport.code})` : ""}`,
    metaDescription: (c) =>
      `Car rental at ${c.name}${c.airport ? ` ${c.airport.code}` : ""} airport. Compare local operators with airport pickup — better rates than airport desks.`,
    intro: (c) =>
      `Arriving at ${c.name}${c.airport ? ` (${c.airport.code})` : ""} airport? Local car rental companies near the airport often offer better rates than the branded desks inside the terminal. Browse verified operators below and arrange direct pickup.`,
    whyLocal: (c) =>
      `Airport car rental desks in ${c.name} charge a premium for the convenience of terminal location. Local operators nearby offer the same pickup convenience — often with free hotel or terminal delivery — at significantly lower daily rates.`,
    faqs: (c) => [
      {
        q: `Can I rent a car at ${c.name} airport?`,
        a: `Yes. Local operators listed on CarRentDesk offer pickup at or near ${c.name}${c.airport ? ` (${c.airport.code})` : ""} airport, often with free delivery to the terminal.`,
      },
      {
        q: `Is it cheaper to rent a car away from ${c.name} airport?`,
        a: `Yes, airport desks in ${c.name} charge location surcharges of 15–25%. Local operators just outside the airport offer the same convenience at lower prices.`,
      },
      {
        q: `How do I arrange airport pickup in ${c.name}?`,
        a: `Contact rental companies directly via CarRentDesk. Most local operators in ${c.name} offer free airport pickup or delivery when you book in advance.`,
      },
      {
        q: `Do I need to book in advance for airport car rental in ${c.name}?`,
        a: `Booking 24–48 hours ahead is recommended, especially in summer. Contact operators directly to arrange your preferred pickup time and location.`,
      },
      {
        q: `Which car rental companies operate near ${c.name}${c.airport ? ` ${c.airport.code}` : ""} airport?`,
        a: `Browse CarRentDesk listings for ${c.name} — local companies clearly indicate whether they offer airport pickup. You can contact them directly by phone, WhatsApp, or email.`,
      },
    ],
  },
];

/** Return only the intents valid for a given city */
export function getIntentsForCity(city: City): Intent[] {
  return INTENTS.filter((i) => !i.requiresAirport || Boolean(city.airport));
}

export function getIntentBySlug(slug: string): Intent | undefined {
  return INTENTS.find((i) => i.slug === slug);
}

/** All city+intent pairs for generateStaticParams */
export function getAllIntentParams(cities: City[]): { city: string; intent: string }[] {
  return cities.flatMap((city) =>
    getIntentsForCity(city).map((intent) => ({
      city: city.slug,
      intent: intent.slug,
    }))
  );
}

export { YEAR };
