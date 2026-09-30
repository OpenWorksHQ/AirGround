import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Eyebrow } from "@/components/ag";
import { ServiceIcon } from "@/components/service-icon";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useCategories, useServices } from "@/lib/catalog";

export const Route = createFileRoute("/services/")({
  head: () => ({
    meta: [
      { title: "Services — AIRGROUND Home Services" },
      {
        name: "description",
        content:
          "Browse AirGround services: lawn and landscaping, property maintenance, heating and cooling, indoor air quality and seasonal care.",
      },
      { property: "og:title", content: "AIRGROUND Services" },
      {
        property: "og:description",
        content: "Lawn, property, heating, cooling and air quality services in one place.",
      },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const { data: categories } = useCategories();
  const { data: services } = useServices();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="mx-auto max-w-[1400px] px-5 py-12 lg:px-10">
        <Eyebrow>Services</Eyebrow>
        <h1 className="display-xl mt-5 max-w-2xl text-[2.6rem] sm:text-[3.4rem]">
          What Does Your Home Need?
        </h1>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {(categories ?? [])
            .filter((c) => c.slug !== "full-home-care")
            .map((c) => {
              const inCategory = (services ?? []).filter((s) => s.category_slug === c.slug);
              return (
                <div key={c.slug} className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-start gap-4">
                    <ServiceIcon name={c.icon} className="mt-0.5 h-8 w-8 shrink-0 text-foreground" />
                    <div className="min-w-0">
                      <h2 className="text-xl font-extrabold">{c.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{c.blurb}</p>
                    </div>
                  </div>

                  <ul className="mt-5 divide-y divide-border border-t border-border">
                    {inCategory.map((s) => (
                      <li key={s.id}>
                        <Link
                          to="/services/$service"
                          params={{ service: s.slug }}
                          className="group flex items-center justify-between gap-4 py-3"
                        >
                          <span className="min-w-0 truncate text-sm font-semibold">{s.name}</span>
                          <span className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                            {s.price_from ? `from $${Number(s.price_from).toFixed(0)}` : "Quoted"}
                            <ArrowRight
                              className="h-4 w-4 text-foreground transition-transform group-hover:translate-x-0.5"
                              strokeWidth={1.5}
                            />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
