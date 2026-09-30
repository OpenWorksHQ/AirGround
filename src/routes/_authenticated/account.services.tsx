import { createFileRoute } from "@tanstack/react-router";

import { ButtonLink, Eyebrow, StatusChip } from "@/components/ag";
import { AccountShell } from "@/components/account-shell";
import { formatDate, isUpcoming, useMyRequests } from "@/lib/account";

export const Route = createFileRoute("/_authenticated/account/services")({
  head: () => ({
    meta: [
      { title: "My Services — AIRGROUND Home Services" },
      { name: "description", content: "Upcoming and completed AirGround services for your property." },
      { property: "og:title", content: "My Services — AIRGROUND" },
      { property: "og:description", content: "Your upcoming and past AirGround work." },
    ],
  }),
  component: MyServices,
});

function MyServices() {
  const { data: requests } = useMyRequests();
  const upcoming = (requests ?? []).filter(isUpcoming);
  const past = (requests ?? []).filter((r) => !isUpcoming(r));

  return (
    <AccountShell>
      <Eyebrow>My Services</Eyebrow>
      <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <h1 className="display-xl text-[2.4rem]">Everything we've handled.</h1>
        <ButtonLink to="/book" search={{ mode: "once" }}>
          Request a service
        </ButtonLink>
      </div>

      <Section title="Upcoming" rows={upcoming} empty="No upcoming visits." />
      <Section title="Previous" rows={past} empty="Nothing completed yet." />
    </AccountShell>
  );
}

function Section({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: ReturnType<typeof useMyRequests>["data"];
  empty: string;
}) {
  return (
    <section className="mt-8">
      <span className="eyebrow">{title}</span>
      <div className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
        {(rows ?? []).map((r) => (
          <div key={r.id} className="grid gap-2 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="truncate text-base font-bold">{r.service_name}</h2>
                <span className="text-xs text-muted-foreground">{r.request_number}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDate(r.requested_date)}
                {r.time_window ? ` · ${r.time_window}` : ""}
                {r.care_plan_id ? " · Ongoing care" : ""}
              </p>
              {r.description ? (
                <p className="mt-1 truncate text-xs text-muted-foreground">{r.description}</p>
              ) : null}
            </div>
            <StatusChip status={r.status} />
          </div>
        ))}
        {(rows ?? []).length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">{empty}</p>
        ) : null}
      </div>
    </section>
  );
}
