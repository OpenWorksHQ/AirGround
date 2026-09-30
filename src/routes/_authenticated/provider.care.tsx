import { createFileRoute } from "@tanstack/react-router";

import { FREQUENCY_LABEL } from "@/components/ag";
import { Empty, Section } from "@/components/provider-portal-ui";
import { useProviderPortal } from "@/lib/provider-portal";

export const Route = createFileRoute("/_authenticated/provider/care")({
  component: ProviderCare,
});

function ProviderCare() {
  const { data, isLoading } = useProviderPortal();
  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="display-xl text-[2.2rem]">Ongoing Care</h1>
      {data.plans.map((plan) => {
        const c = data.customers.find((x) => x.id === plan.user_id);
        const prop = data.properties.find((x) => x.id === plan.property_id);
        const items = data.items.filter((i) => i.care_plan_id === plan.id);
        return (
          <Section
            key={plan.id}
            title={`${c?.full_name ?? c?.email ?? "Customer"} · ${prop ? `${prop.address_line1}, ${prop.zip}` : "No address"} · ${plan.status}`}
          >
            <div className="divide-y divide-border">
              {items.map((i) => (
                <div key={i.id} className="grid gap-1 px-6 py-3 sm:grid-cols-[minmax(0,1fr)_160px_160px_100px]">
                  <span className="text-sm font-bold">{i.service_name}</span>
                  <span className="text-sm text-muted-foreground">{FREQUENCY_LABEL[i.frequency] ?? i.frequency}</span>
                  <span className="text-sm text-muted-foreground">Next: {i.next_service_date ?? "—"}</span>
                  <span className="text-sm text-muted-foreground">{i.paused ? "Paused" : "Active"}</span>
                </div>
              ))}
              {items.length === 0 ? <Empty>No services on this plan.</Empty> : null}
            </div>
          </Section>
        );
      })}
      {data.plans.length === 0 ? (
        <Section title="Recurring customers">
          <Empty>No ongoing-care customers yet.</Empty>
        </Section>
      ) : null}
    </div>
  );
}
