"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";

interface Company {
  id: string;
  name: string;
  slug: string;
  status: string;
}

interface Props {
  user: { email: string };
  companies: Company[];
  activeCompanyId: string | null;
  children: React.ReactNode;
}

export function AppShell({ user, companies, activeCompanyId, children }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile sidebar on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* ── Mobile backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* ── Sidebar ── */}
      {/* Desktop: always visible. Mobile: slide in from left when open */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transition-transform duration-200
        lg:static lg:z-auto lg:translate-x-0 lg:transition-none
        ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <Sidebar
          user={user}
          companies={companies}
          activeCompanyId={activeCompanyId}
          onCloseMobile={() => setOpen(false)}
        />
      </div>

      {/* ── Main content ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Mobile top bar */}
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-white px-4 lg:hidden">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 hover:bg-slate-100"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <span className="text-sm font-bold text-brand-950">CarRentDesk</span>
          <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
            Ops
          </span>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
