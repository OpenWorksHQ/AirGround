import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useProviderPortal } from "@/lib/provider-portal";

export const Route = createFileRoute("/_authenticated/provider")({
  head: () => ({
    meta: [
      { title: "Provider Dashboard — AIRGROUND" },
      { name: "description", content: "Your private AirGround provider workspace." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Provider Dashboard — AIRGROUND" },
      { property: "og:description", content: "Jobs, schedule, ongoing care and earnings for AirGround providers." },
    ],
  }),
  component: ProviderLayout,
});

const TABS = [
  { to: "/provider", label: "Dashboard", exact: true },
  { to: "/provider/jobs", label: "Jobs / Requests", exact: false },
  { to: "/provider/schedule", label: "Schedule", exact: false },
  { to: "/provider/care", label: "Ongoing Care", exact: false },
  { to: "/provider/earnings", label: "Earnings / Payouts", exact: false },
  { to: "/provider/services", label: "My Services", exact: false },
  { to: "/provider/page", label: "My Provider Page", exact: false },
  { to: "/provider/account", label: "Account", exact: false },
] as const;

function ProviderLayout() {
  const { data, isLoading } = useProviderPortal();
  const name = data?.providers.map((p) => p.name).join(" · ");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="border-b border-border bg-paper">
        <div className="mx-auto max-w-[1200px] px-5 pt-5 lg:px-10">
          <span className="eyebrow">Provider Dashboard{name ? ` · ${name}` : ""}</span>
        </div>
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
      <main className="mx-auto max-w-[1200px] px-5 py-10 lg:px-10">
        {!isLoading && data && data.providers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Your account isn't linked to a provider yet. Ask AirGround to add you.
          </p>
        ) : (
          <Outlet />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
