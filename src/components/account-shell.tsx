import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const TABS = [
  { to: "/account", label: "My Home", exact: true },
  { to: "/account/services", label: "My Services", exact: false },
  { to: "/account/home-care", label: "Ongoing Care", exact: false },
  { to: "/account/payments", label: "Payments", exact: false },
] as const;

export function AccountShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="border-b border-border bg-paper">
        <nav className="mx-auto flex max-w-[1200px] gap-1 overflow-x-auto px-5 lg:px-10">
          {TABS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              activeOptions={{ exact: t.exact }}
              activeProps={{ className: "border-foreground text-foreground" }}
              inactiveProps={{ className: "border-transparent text-muted-foreground" }}
              className="whitespace-nowrap border-b-2 px-3 py-4 text-sm font-semibold hover:text-foreground"
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
      <main className="mx-auto max-w-[1200px] px-5 py-10 lg:px-10">{children}</main>
      <SiteFooter />
    </div>
  );
}
