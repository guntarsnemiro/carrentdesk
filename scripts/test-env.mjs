import { readFileSync } from "node:fs";

const env = readFileSync(".env.local", "utf8")
  .split(/\r?\n/)
  .filter((line) => line && !line.trim().startsWith("#"))
  .reduce((acc, line) => {
    const eq = line.indexOf("=");
    if (eq === -1) return acc;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (key) acc[key] = value;
    return acc;
  }, {});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = env.SUPABASE_SERVICE_ROLE_KEY;

const mask = (label, value) => {
  if (!value) return `${label}: ❌ MISSING`;
  if (value.includes("PASTE") || value.includes("YOUR_PROJECT_REF")) {
    return `${label}: ❌ STILL PLACEHOLDER`;
  }
  return `${label}: ✅ present (${value.length} chars)`;
};

console.log("--- .env.local check ---");
console.log(mask("NEXT_PUBLIC_SUPABASE_URL", url));
console.log(mask("NEXT_PUBLIC_SUPABASE_ANON_KEY", anon));
console.log(mask("SUPABASE_SERVICE_ROLE_KEY", service));

if (!url || !anon || url.includes("YOUR_PROJECT_REF") || anon.includes("PASTE")) {
  console.error("\n❌ Cannot test connection — fix placeholders first.");
  process.exit(1);
}

console.log("\n--- Supabase connection test ---");

const testKey = async (label, key) => {
  try {
    const res = await fetch(
      `${url}/rest/v1/_does_not_exist_yet?select=*`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      }
    );
    const body = await res.text();
    if (res.status === 404 || res.status === 200) {
      console.log(`✅ ${label}: key valid (HTTP ${res.status})`);
      return true;
    }
    if (res.status === 401) {
      console.log(`❌ ${label}: key REJECTED — ${body.slice(0, 150)}`);
      return false;
    }
    console.log(`⚠️  ${label}: HTTP ${res.status} — ${body.slice(0, 150)}`);
    return false;
  } catch (err) {
    console.error(`❌ ${label}: connection error — ${err.message}`);
    return false;
  }
};

const anonOk = await testKey("anon key", anon);
const serviceOk = await testKey("service_role key", service);

if (anonOk && serviceOk) {
  console.log("\n🎯 Both keys work. Env is wired up correctly.");
  process.exit(0);
} else {
  console.log("\n❌ One or more keys failed. Re-check Supabase dashboard.");
  process.exit(1);
}
