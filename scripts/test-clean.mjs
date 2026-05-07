// Quick test harness for cleanDisplayName — run with `node scripts/test-clean.mjs`
// We re-implement the function inline so we don't have to compile TS.

const CITY_COMMA = /,\s+(Tallinn|Riga|R\u012bga|Vilnius)(\s+car\s+rentals?)?\s*$/iu;
const CITY_IN = /\s+in\s+(Tallinn|Riga|R\u012bga|Vilnius|Estonia|Latvia|Lithuania)\s*$/iu;
const CITY_TRAILING = /\s+(Tallinn|Riga|R\u012bga|Vilnius|Estonia|Latvia|Lithuania)\s*$/iu;
const RENTAL_BOILERPLATE = /(car rental services?|car rentals?|car rent|rent a car|rental services?|automobili[u\u0173] nuomos?|auto noma|autonuoma)/i;

const KEEP_UPPERCASE = new Set([
  "OU", "O\u00dc", "SIA", "UAB", "GMBH", "BV", "AS", "AB", "SP", "EU",
  "EV", "DBA", "VIP", "VNO", "RIX", "TLL",
]);

function titleCase(s) {
  return s
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((p) => {
      if (!p || /^\s+$/.test(p) || p === "-") return p;
      const u = p.toUpperCase();
      if (KEEP_UPPERCASE.has(u)) return u;
      return p.charAt(0).toUpperCase() + p.slice(1);
    })
    .join("");
}

function trySoft(input, rule) {
  const after = rule(input).trim();
  if (
    after.length < 4 ||
    /^(car|auto|rent|the|a|in|at|of|on)\s*$/i.test(after) ||
    /^(car|auto)\s+(rent|rental)s?(\s+in)?\s*$/i.test(after) ||
    /^(Tallinn|Riga|R\u012bga|Vilnius|Estonia|Latvia|Lithuania)\s*$/i.test(after) ||
    /[-\u2013\u2014]\s*$/.test(after) ||
    (!/\s/.test(after) && after.length < 8)
  ) {
    return input;
  }
  return after;
}

function clean(raw) {
  let s = raw.trim();
  s = s.replace(/\s*\([^)]*\)\s*$/u, "").trim();
  if (/[\u0400-\u04FF]/.test(s) && s.includes(" / ")) s = s.split(" / ")[0].trim();
  if (s.length > 35 && s.includes(" / ")) s = s.split(" / ")[0].trim();
  if (s.includes(" | ")) s = s.split(" | ")[0].trim();
  s = s.replace(CITY_COMMA, "").trim();

  s = trySoft(s, (x) => x.replace(CITY_IN, "").trim());
  s = trySoft(s, (x) => x.replace(CITY_TRAILING, "").trim());
  s = trySoft(s, (x) =>
    x.replace(new RegExp(`\\s*[-\u2013\u2014]?\\s*${RENTAL_BOILERPLATE.source}\\s*$`, "i"), "").trim()
  );

  if (s.length >= 4 && s === s.toUpperCase() && /[A-Z]/.test(s)) {
    s = titleCase(s);
  }

  s = s.replace(/\s+/g, " ").trim();
  return s.length < 2 ? raw.trim() : s;
}

const samples = [
  "Eesti Autorent",
  "Baltic Car, Tallinn car rental",
  "Easy Car Rent Tallinn Airport",
  "addCar - Car Rental Services",
  "Car rental in Estonia",
  "Autorent OU - 1autorent",
  "V\u00e4ikebussi rent",
  "Auto Rental Tallinn",
  "Sir Autorent O\u00dc",
  "Sky Ltd. Car Rental in Tallinn",
  "Toprent",
  "Autonomariga",
  "Car rental - Prime Auto | Riga",
  "Car rental 123",
  "Vitarent",
  "GBY RENT VILNIUS - AUTOMOBILI\u0172 NUOMA / CAR RENTAL",
  "Solorent car rental Vilnius",
  "AUTOCOM Car Rental",
  "Wheego | Rent A Car | Vilnius Airport",
  "Prime Car Rent",
  "ADCRent",
  "Admita - Car Rental Vilnius Airport (VNO)",
  "E-CAR",
  "EASYCARS P4 parking (pick-up / return point)",
  "Car rent Riga / Auto noma / \u0410\u0440\u0435\u043d\u0434\u0430 \u0430\u0432\u0442\u043e\u043c\u043e\u0431\u0438\u043b\u0435\u0439",
  "Fun Car Rent Riga",
  "Car4rent",
  "RIGA CAR RENT",
  "EZrent",
];

for (const x of samples) {
  const c = clean(x);
  const marker = c === x ? "  " : "->";
  console.log(`${marker} ${x.padEnd(55).slice(0, 55)} | ${c}`);
}
