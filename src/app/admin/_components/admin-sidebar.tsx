"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  soon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Pipeline", href: "/admin/pipeline", icon: <PipelineIcon /> },
  { label: "Analytics", href: "/admin/analytics", icon: <ChartIcon />, soon: true },
  { label: "Operators", href: "/admin/operators", icon: <UsersIcon />, soon: true },
];

export function AdminSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = getAuthBrowserClient();
    await supabase.auth.signOut();
    router.push("/app/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-border bg-white">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <Link href="/admin/pipeline" className="flex items-center gap-2">
          <span className="text-sm font-bold text-brand-950">CarRentDesk</span>
          <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
            Admin
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
          Sales & CRM
        </p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.label}>
                {item.soon ? (
                  <span className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-neutral-400 opacity-60">
                    <span className="h-4 w-4 shrink-0">{item.icon}</span>
                    {item.label}
                    <span className="ml-auto rounded bg-neutral-100 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-neutral-400">
                      Soon
                    </span>
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                      isActive
                        ? "bg-violet-50 font-medium text-violet-900"
                        : "text-neutral-600 hover:bg-slate-50 hover:text-neutral-900"
                    }`}
                  >
                    <span className={`h-4 w-4 shrink-0 ${isActive ? "text-violet-600" : "text-neutral-400"}`}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-6">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Switch to
          </p>
          <Link
            href="/app/dashboard"
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-neutral-500 hover:bg-slate-50 hover:text-neutral-800"
          >
            <span className="h-4 w-4 shrink-0 text-neutral-400"><OpsIcon /></span>
            Ops platform
          </Link>
        </div>
      </nav>

      <div className="border-t border-border px-3 py-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
            {userEmail[0].toUpperCase()}
          </div>
          <span className="min-w-0 flex-1 truncate text-xs text-neutral-500">{userEmail}</span>
          <button onClick={handleSignOut} title="Sign out" className="shrink-0 text-neutral-400 hover:text-neutral-600">
            <SignOutIcon />
          </button>
        </div>
      </div>
    </aside>
  );
}

function PipelineIcon() {
  return <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21 21 17.25" /></svg>;
}
function ChartIcon() {
  return <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>;
}
function UsersIcon() {
  return <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>;
}
function OpsIcon() {
  return <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>;
}
function SignOutIcon() {
  return <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>;
}
