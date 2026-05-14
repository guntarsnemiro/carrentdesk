"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";

let cached: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Auth-aware browser Supabase client.
 * Uses @supabase/ssr to share the session cookie with the server.
 * Singleton per page load — safe to call multiple times in client components.
 */
export function getAuthBrowserClient() {
  if (cached) return cached;
  cached = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return cached;
}
