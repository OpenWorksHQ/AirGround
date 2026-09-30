import { createFileRoute } from "@tanstack/react-router";

import { FREQUENCY_LABEL } from "@/components/ag";
import { Empty, Section } from "@/components/provider-portal-ui";
import { useProviderPortal } from "@/lib/provider-portal";
import { formatPrice } from "@/lib/providers";

export const Route = createFileRoute("/_authenticated/provider/services")({
  component: ProviderServices,
});

function ProviderServices() {
  const { data, isLoading } = useProviderPortal();
  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="display-xl text-[2.2rem]">My Services</h1>
      <p className="text-sm text-muted-foreground">
        These are set by AirGround. Contact AirGround to change services, prices or your area.
      </p>
      {data.providers.map((p) => (
        <Section key={p.id} title={`${p.name} · ${p.service_area || "Service area not set"}`}>
          <div className="divide-y divide-border">
            {p.zip_codes.length > 0 ? (
              <p className="px-6 py-3 text-xs text-muted-foreground">ZIP codes: {p.zip_codes.join(", ")}</p>
            ) : null}
            {data.offerings
              .filter((o) => o.provider_id === p.id)
              .map((o) => (
                <div key={o.id} className="grid gap-1 px-6 py-3 sm:grid-cols-[minmax(0,1fr)_160px_minmax(0,220px)_80px]">
                  <span className="text-sm font-bold">{o.service?.name}</span>
                  <span className="text-sm">{formatPrice(o)}</span>
                  <span className="text-sm text-muted-foreground">
                    {o.recurring_enabled
                      ? `Recurring: ${o.allowed_frequencies.map((f) => FREQUENCY_LABEL[f] ?? f).join(", ")}`
                      : "One-time only"}
                  </span>
                  <span className="text-sm text-muted-foreground">{o.enabled ? "Live" : "Hidden"}</span>
                </div>
              ))}
            {data.offerings.filter((o) => o.provider_id === p.id).length === 0 ? (
              <Empty>No services assigned yet.</Empty>
            ) : null}
          </div>
        </Section>
      ))}
    </div>
  );
}
