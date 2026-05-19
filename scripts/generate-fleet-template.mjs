import * as XLSX from "xlsx";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "../public/templates/fleet-import-template.xlsx");

const headers = [
  "Make", "Model", "Year", "Plate", "Fuel", "Seats",
  "Color", "Category",
  "VIN", "Registration Number",
  "Odometer (km)",
  "Gov Inspection Last (date)", "Gov Inspection Next (date)",
  "Service Last (date)", "Service Next (date)",
  "Insurance Number", "Insurance Valid Until (date)",
  "Notes",
];

const example = [
  "Toyota", "Corolla", 2020, "ABC-123", "petrol", 5,
  "White", "compact",
  "JTDBL40E309123456", "LV-123456",
  85000,
  "15.03.2024", "15.03.2026",
  "10.01.2024", "10.01.2025",
  "POL-12345678", "31.12.2025",
  "Airport delivery key in glove box",
];

const example2 = [
  "Volvo", "S60", 2019, "XYZ-789", "diesel", 5,
  "Silver", "midsize",
  "", "",
  120000,
  "", "01.06.2026",
  "", "",
  "", "",
  "",
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet([headers, example, example2]);

// Column widths
ws["!cols"] = [
  { wch: 12 }, { wch: 12 }, { wch: 6 }, { wch: 10 }, { wch: 10 }, { wch: 6 },
  { wch: 10 }, { wch: 10 },
  { wch: 20 }, { wch: 18 },
  { wch: 14 },
  { wch: 28 }, { wch: 28 },
  { wch: 24 }, { wch: 24 },
  { wch: 18 }, { wch: 26 },
  { wch: 30 },
];

XLSX.utils.book_append_sheet(wb, ws, "Fleet");

// Notes sheet
const notesData = [
  ["Field", "Required", "Allowed values / format"],
  ["Make", "YES", "Free text — e.g. Toyota, Volvo, BMW"],
  ["Model", "YES", "Free text — e.g. Corolla, S60"],
  ["Year", "YES", "Number — e.g. 2020"],
  ["Plate", "YES", "Free text — e.g. ABC-123"],
  ["Fuel", "YES", "diesel | petrol | electric | hybrid | lpg"],
  ["Seats", "YES", "Number 1-20"],
  ["Color", "no", "Free text — e.g. White, Silver"],
  ["Category", "no", "economy | compact | midsize | suv | van | luxury | other"],
  ["VIN", "no", "Free text"],
  ["Registration Number", "no", "Free text"],
  ["Odometer (km)", "no", "Number"],
  ["Gov Inspection Last", "no", "Date: DD.MM.YYYY or DD/MM/YYYY or YYYY-MM-DD  (e.g. 20.05.2027 or 20/05/2027)"],
  ["Gov Inspection Next", "no", "Date: DD.MM.YYYY or DD/MM/YYYY or YYYY-MM-DD  (e.g. 20.05.2027 or 20/05/2027)"],
  ["Service Last", "no", "Date: DD.MM.YYYY or DD/MM/YYYY or YYYY-MM-DD  (e.g. 20.05.2027 or 20/05/2027)"],
  ["Service Next", "no", "Date: DD.MM.YYYY or DD/MM/YYYY or YYYY-MM-DD  (e.g. 20.05.2027 or 20/05/2027)"],
  ["Insurance Number", "no", "Free text"],
  ["Insurance Valid Until", "no", "Date: DD.MM.YYYY or DD/MM/YYYY or YYYY-MM-DD  (e.g. 20.05.2027 or 20/05/2027)"],
  ["Notes", "no", "Free text"],
];
const wsNotes = XLSX.utils.aoa_to_sheet(notesData);
wsNotes["!cols"] = [{ wch: 28 }, { wch: 10 }, { wch: 40 }];
XLSX.utils.book_append_sheet(wb, wsNotes, "Field Reference");

fs.mkdirSync(path.dirname(outPath), { recursive: true });
XLSX.writeFile(wb, outPath);
console.log("Template written to", outPath);
