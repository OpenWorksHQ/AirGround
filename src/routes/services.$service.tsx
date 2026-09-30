import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";

import { Button, ButtonLink, Eyebrow } from "@/components/ag";
import { ServiceIcon } from "@/components/service-icon";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useCategories, useService, useServices } from "@/lib/catalog";
import { loadDraft, saveDraft } from "@/lib/booking";

export const Route = createFileRoute("/services/$service")({
  head: ({ params }) => {
    const title = params.service
      .split("-")
      .map((w) => w[0]?.toUpperCase() + w.slice(1))
      .join(" ");
    return {
      meta: [
        { title: `${title} — AIRGROUND Home Services` },
        {
          name: "description",
          content: `${title} from AirGround. Book once or keep it scheduled on an ongoing care plan.`,
        },
        { property: "og:title", content: `${title} — AIRGROUND` },
        {
          property: "og:description",
          content: `${title} from AirGround. Book once or keep it scheduled.`,
        },
      ],
    };
  },
  component: ServiceDetail,
});

function ServiceDetail() {
  const { service: slug } = Route.useParams();
  const navigate = useNavigate();
  const { data: service, isLoading } = useService(slug);
  const { data: categories } = useCategories();
  const category = (categories ?? []).find((c) => c.slug === slug);
  const { data: inCategory } = useServices(category ? slug : undefined);

  const start = (mode: "once" | "care") => {
    const draft = loadDraft();
    saveDraft({
      ...draft,
      mode,
      categorySlug: service?.category_slug ?? null,
      serviceId: service?.id ?? null,
      serviceName: service?.name ?? null,
      carePicks:
        mode === "care" && service
          ? [
              {
                serviceId: service.id,
                serviceName: service.name,
                frequency: service.default_frequency ?? "monthly",
              },
            ]
          : draft.carePicks,
    });
    navigate({ to: "/book", search: { mode } });
  };

  // A category slug landed here (from the homepage strip) — show its services.
  if (category) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <section className="mx-auto max-w-[1000px] px-5 py-12 lg:px-10">
          <Link to="/services" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> All services
          </Link>
          <div className="mt-6 flex items-start gap-4">
            <ServiceIcon name={category.icon} className="mt-1 h-9 w-9 shrink-0" />
            <div>
              <h1 className="display-xl text-[2.4rem]">{category.name}</h1>
              <p className="mt-2 max-w-xl text-muted-foreground">{category.blurb}</p>
            </div>
          </div>
          <ul className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
            {(inCategory ?? []).map((s) => (
              <li key={s.id}>
                <Link
                  to="/services/$service"
                  params={{ service: s.slug }}
                  className="flex items-center justify-between gap-4 px-6 py-4"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{s.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{s.summary}</span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                    {s.price_from ? `from $${Number(s.price_from).toFixed(0)}` : "Quoted"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-[840px] px-5 py-12 lg:px-10">
        <Link to="/services" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> All services
        </Link>

        {isLoading ? (
          <p className="mt-10 text-sm text-muted-foreground">Loading…</p>
        ) : !service ? (
          <div className="mt-10">
            <h1 className="display-xl text-[2.2rem]">We don't offer that one</h1>
            <p className="mt-2 text-muted-foreground">Browse the full list instead.</p>
          </div>
        ) : (
          <>
            <Eyebrow className="mt-8">
              {(categories ?? []).find((c) => c.slug === service.category_slug)?.name ?? "Service"}
            </Eyebrow>
            <h1 className="display-xl mt-4 text-[2.8rem]">{service.name}</h1>
            <p className="mt-3 max-w-xl text-lg text-foreground/80">{service.summary}</p>

            <div className="mt-8 rounded-2xl border border-border bg-card p-6">
              <span className="eyebrow">What's included</span>
              <ul className="mt-4 space-y-2.5">
                {service.included.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} />
                    {item}
                  </li>
                ))}
              </ul>
              {service.price_from ? (
                <p className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
                  Starting at{" "}
                  <span className="font-bold text-foreground">
                    ${Number(service.price_from).toFixed(0)}
                  </span>{" "}
                  — final pricing confirmed after we review your property.
                </p>
              ) : (
                <p className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
                  Priced after we review the details you send.
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => start("once")}>
                Book Once
              </Button>
              {service.recurring_allowed ? (
                <Button variant="outline" size="lg" onClick={() => start("care")}>
                  Keep It Scheduled
                </Button>
              ) : null}
              <ButtonLink to="/ongoing-care" variant="quiet" size="lg">
                How ongoing care works
              </ButtonLink>
            </div>
          </>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
