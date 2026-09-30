import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, MapPin, Repeat } from "lucide-react";

import { ButtonLink } from "@/components/ag";
import { Logo } from "@/components/brand";
import { ServiceIcon } from "@/components/service-icon";
import { FREQUENCY_LABEL } from "@/components/ag";
import { formatPrice, useProvider, WEEKDAYS } from "@/lib/providers";

export const Route = createFileRoute("/p/$slug")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Book with your provider — AIRGROUND Home Services" },
      { name: "description", content: "Book your provider's home services through AirGround — once or on a schedule." },
      { property: "og:title", content: "Book with your provider — AIRGROUND" },
      { property: "og:description", content: "Pick a service, choose one-time or recurring, and schedule it through AirGround." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProviderPage,
});

function ProviderPage() {
  const { slug } = Route.useParams();
  const { data, isLoading } = useProvider(slug);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="mx-auto flex max-w-[1000px] items-center justify-between px-5 py-5 lg:px-10">
          <Logo />
          <span className="eyebrow">Powered by AirGround</span>
        </div>
      </div>
      <div className="mx-auto max-w-[1000px] px-5 py-10 lg:px-10">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !data ? (
          <div className="py-10 text-center">
            <h1 className="display-xl text-[2.2rem]">This booking page isn't available.</h1>
            <p className="mt-2 text-sm text-muted-foreground">The link may be old or the provider is paused.</p>
            <Link to="/" className="mt-6 inline-flex text-sm font-semibold text-primary">
              Go to AirGround
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              {data.provider.image_url ? (
                <img
                  src={data.provider.image_url}
                  alt={data.provider.name}
                  className="h-20 w-20 rounded-2xl border border-border object-cover"
                />
              ) : null}
              <div className="min-w-0">
                <h1 className="display-xl text-[2.4rem]">{data.provider.name}</h1>
                {data.provider.description ? (
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{data.provider.description}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-muted-foreground">
                  {data.provider.service_area ? (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} /> {data.provider.service_area}
                    </span>
                  ) : null}
                  {data.provider.available_days.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarClock className="h-3.5 w-3.5" strokeWidth={1.75} />
                      {WEEKDAYS.filter((d) => data.provider.available_days.includes(d.value))
                        .map((d) => d.label)
                        .join(" · ")}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-10 grid gap-3">
              {data.offerings.map((o) => (
                <div
                  key={o.id}
                  className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="flex min-w-0 gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                      <ServiceIcon name={o.service.category_slug} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold">{o.service.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{o.service.summary}</p>
                      <p className="mt-2 text-sm font-bold text-primary">{formatPrice(o)}</p>
                      {o.recurring_enabled && o.allowed_frequencies.length > 0 ? (
                        <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Repeat className="h-3 w-3" strokeWidth={1.75} />
                          {o.allowed_frequencies.map((f) => FREQUENCY_LABEL[f] ?? f).join(", ")}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ButtonLink
                      to="/book"
                      search={{ mode: "once", provider: data.provider.slug, service: o.service_id }}
                      size="sm"
                    >
                      Book Once
                    </ButtonLink>
                    {o.recurring_enabled ? (
                      <ButtonLink
                        to="/book"
                        search={{ mode: "care", provider: data.provider.slug, service: o.service_id }}
                        size="sm"
                        variant="outline"
                      >
                        Keep It Scheduled
                      </ButtonLink>
                    ) : null}
                  </div>
                </div>
              ))}
              {data.offerings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No services are open for booking right now.</p>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
