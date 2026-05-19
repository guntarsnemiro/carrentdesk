import * as XLSX from "xlsx";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "../public/templates/customer-import-template.xlsx");

const headers = [
  "Full Name", "Phone", "Email", "Language",
  "Address", "Date of Birth", "ID / Passport", "ID Expiry",
  "Driver License No", "Driver License Expiry",
  "Notes", "Blacklisted",
];

const example1 = [
  "Jānis Bērziņš", "+371 26123456", "janis@example.com", "lv",
  "Rīga, Brīvības 1", "15.06.1985", "PA1234567", "20.05.2030",
  "LV12345678", "20.05.2028",
  "", "no",
];

const example2 = [
  "Ivan Petrov", "+371 29987654", "", "ru",
  "", "", "", "",
  "", "",
  "Prefers early morning pickup", "no",
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet([headers, example1, example2]);

ws["!cols"] = [
  { wch: 22 }, { wch: 18 }, { wch: 26 }, { wch: 10 },
  { wch: 26 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
  { wch: 18 }, { wch: 20 },
  { wch: 30 }, { wch: 12 },
];

XLSX.utils.book_append_sheet(wb, ws, "Customers");

const notesData = [
  ["Field", "Required", "Allowed values / format"],
  ["Full Name", "YES", "Free text — first and last name"],
  ["Phone", "YES", "Any format — e.g. +371 26123456 or 0037126123456"],
  ["Email", "no", "Valid email address"],
  ["Language", "no", "en | lv | ru | other"],
  ["Address", "no", "Free text"],
  ["Date of Birth", "no", "Date: DD.MM.YYYY or DD/MM/YYYY or YYYY-MM-DD  (e.g. 15.06.1985)"],
  ["ID / Passport", "no", "Free text — ID or passport number"],
  ["ID Expiry", "no", "Date: DD.MM.YYYY or DD/MM/YYYY or YYYY-MM-DD"],
  ["Driver License No", "no", "Free text"],
  ["Driver License Expiry", "no", "Date: DD.MM.YYYY or DD/MM/YYYY or YYYY-MM-DD"],
  ["Notes", "no", "Free text — internal notes"],
  ["Blacklisted", "no", "yes | no  (default: no)"],
  ["", "", ""],
  ["Note:", "", "Existing customers matched by phone number will be updated, not duplicated."],
];

const wsNotes = XLSX.utils.aoa_to_sheet(notesData);
wsNotes["!cols"] = [{ wch: 24 }, { wch: 10 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, wsNotes, "Field Reference");

fs.mkdirSync(path.dirname(outPath), { recursive: true });
XLSX.writeFile(wb, outPath);
console.log("Template written to", outPath);
