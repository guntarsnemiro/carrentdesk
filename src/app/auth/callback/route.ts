import { NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase/auth-server";

/**
 * Supabase Auth PKCE callback.
 * After the user clicks the magic-link email, Supabase redirects here with a
 * `code` query param. We exchange it for a session cookie and send the user
 * to their intended destination (or the dashboard as a fallback).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app/dashboard";

  if (code) {
    const supabase = await createAuthServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Exchange failed — redirect to login with an error hint.
  return NextResponse.redirect(`${origin}/app/login?error=link_expired`);
}
