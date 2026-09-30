import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, MapPin } from "lucide-react";

import { Eyebrow, inputStyles } from "@/components/ag";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useProviderDirectory, type DirectoryProvider } from "@/lib/providers";

export const Route = createFileRoute("/providers")({
  head: () => ({
    meta: [
      { title: "Find a Provider — AIRGROUND Home Services" },
      {
        name: "description",
        content:
          "Search approved AirGround providers by name, location, or service and book directly on their AirGround page.",
      },
      { property: "og:title", content: "Find a Provider — AIRGROUND" },
      {
        property: "og:description",
        content: "Search AirGround providers by name, location, or service.",
      },
    ],
  }),
  component: FindProviderPage,
});

function FindProviderPage() {
  const { data: providers, isLoading } = useProviderDirectory();
  const [query, setQuery] = useState("");
  const [trade, setTrade] = useState("");

  const trades = useMemo(() => {
    const names = new Set<string>();
    for (const p of providers ?? []) for (const o of p.offerings) names.add(o.service.name);
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [providers]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (providers ?? []).filter((p) => {
      if (trade && !p.offerings.some((o) => o.service.name === trade)) return false;
      if (!q) return true;
      const services = p.offerings.map((o) => o.service.name).join(" ");
      return `${p.name} ${p.service_area} ${services} MI Michigan`.toLowerCase().includes(q);
    });
  }, [providers, query, trade]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-14 lg:px-10">
          <Eyebrow>Find a Provider</Eyebrow>
          <h1 className="display-xl mt-5 text-[2.6rem] sm:text-[3.4rem]">
            Find a Provider.
          </h1>
          <p className="mt-3 max-w-xl text-[0.95rem] text-muted-foreground">
            Search AirGround providers by name, location, or service.
          </p>

          <div className="mt-7 flex max-w-3xl flex-col gap-3 sm:flex-row">
            <input
              className={`${inputStyles} sm:flex-1`}
              placeholder="Search by name, city, or service…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search providers"
            />
            <select
              className={`${inputStyles} sm:w-56`}
              value={trade}
              onChange={(e) => setTrade(e.target.value)}
              aria-label="Filter by service"
            >
              <option value="">All services</option>
              {trades.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-10 lg:px-10">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading providers…</p>
        ) : results.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
            No providers found for this search yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-border">
        <div className="mx-auto flex max-w-[1400px] flex-col items-start gap-2 px-5 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <p className="text-sm text-muted-foreground">
            Are you a tradesperson? Join AirGround.
          </p>
          <Link
            to="/providers/apply"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground/75 hover:text-foreground"
          >
            Apply to join <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function ProviderCard({ provider }: { provider: DirectoryProvider }) {
  const [primary, ...rest] = provider.offerings.map((o) => o.service.name);
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[1.05rem] font-bold leading-snug">{provider.name}</h3>
        <span className="inline-flex shrink-0 items-center rounded-full bg-secondary px-2.5 py-1 text-[0.65rem] font-bold tracking-wide text-secondary-foreground">
          APPROVED
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold text-primary">{primary}</p>
      {rest.length > 0 ? (
        <p className="mt-1 text-xs text-muted-foreground">Also: {rest.join(", ")}</p>
      ) : null}
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" />
        {provider.service_area || "Michigan"}, MI
      </p>
      <div className="mt-5 flex-1" />
      <Link
        to="/p/$slug"
        params={{ slug: provider.slug }}
        className="inline-flex h-10 items-center justify-center rounded-lg border border-border-strong text-[0.8rem] font-semibold hover:bg-secondary"
      >
        View Provider
      </Link>
    </div>
  );
}
