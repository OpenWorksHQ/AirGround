import { createFileRoute } from "@tanstack/react-router";

import { StatusChip } from "@/components/ag";
import { Empty, Section, Stat, jobContext } from "@/components/provider-portal-ui";
import { money, useProviderPortal } from "@/lib/provider-portal";

export const Route = createFileRoute("/_authenticated/provider/earnings")({
  component: ProviderEarnings,
});

function ProviderEarnings() {
  const { data, isLoading } = useProviderPortal();
  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const sum = (rows: typeof data.jobs) => rows.reduce((s, j) => s + Number(j.quoted_price ?? 0), 0);
  const completed = data.jobs.filter((j) => j.status === "completed");
  const pending = data.jobs.filter((j) => !["completed", "cancelled"].includes(j.status));
  const history = data.jobs.filter((j) => j.status !== "cancelled");

  return (
    <div className="space-y-6">
      <h1 className="display-xl text-[2.2rem]">Earnings / Payouts</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Completed jobs" value={money(sum(completed))} hint={`${completed.length} jobs, at quoted prices`} />
        <Stat label="Pending" value={money(sum(pending))} hint={`${pending.length} open jobs`} />
        <Stat label="Paid out" value={money(0)} hint="No payouts recorded yet" />
      </div>
      <p className="rounded-xl border border-border bg-paper px-5 py-4 text-sm text-muted-foreground">
        Amounts are based on your prices for each job. Payouts aren't set up in AirGround yet, so
        payout status will appear here once AirGround starts sending them.
      </p>
      <Section title="Transaction history">
        <div className="divide-y divide-border">
          {history.map((j) => (
            <div key={j.id} className="grid gap-2 px-6 py-3 sm:grid-cols-[minmax(0,1fr)_120px_110px_auto] sm:items-center">
              <span className="min-w-0 truncate text-sm">
                <span className="font-bold">{j.service_name}</span>{" "}
                <span className="text-muted-foreground">
                  · {j.request_number} · {jobContext(data, j).customerName}
                </span>
              </span>
              <span className="text-sm text-muted-foreground">{j.requested_date ?? "—"}</span>
              <span className="text-sm font-bold">{money(j.quoted_price)}</span>
              <StatusChip status={j.status} />
            </div>
          ))}
          {history.length === 0 ? <Empty>No jobs yet.</Empty> : null}
        </div>
      </Section>
    </div>
  );
}
