"use client";

import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

let cached: SupabaseClient<Database> | null = null;

/**
 * Browser-side Supabase client. Singleton per page session — safe in client
 * components. Anon key is public and scoped by RLS.
 */
export function getBrowserClient(): SupabaseClient<Database> {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase env vars missing in browser bundle. Check Vercel env vars."
    );
  }

  cached = createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
