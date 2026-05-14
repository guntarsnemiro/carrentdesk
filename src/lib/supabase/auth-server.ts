import "server-only";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Auth-aware server Supabase client.
 * Reads & writes cookies so the session survives across RSC and Server Actions.
 * Use this (not the plain `createServerClient`) anywhere the operator is logged in.
 */
export async function createAuthServerClient() {
  const cookieStore = await cookies();

  return createSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — setting cookies is a no-op here.
            // The middleware handles the actual refresh.
          }
        },
      },
    }
  );
}
