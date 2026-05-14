"use client";

import { useRouter } from "next/navigation";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = getAuthBrowserClient();
    await supabase.auth.signOut();
    router.push("/app/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-neutral-500 underline-offset-2 hover:text-neutral-700 hover:underline"
    >
      Sign out
    </button>
  );
}
