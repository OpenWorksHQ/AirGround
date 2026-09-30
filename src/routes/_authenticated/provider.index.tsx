import { createFileRoute, Link } from "@tanstack/react-router";

import { Empty, JobRow, Section, Stat } from "@/components/provider-portal-ui";
import { money, todayIso, useProviderPortal } from "@/lib/provider-portal";

export const Route = createFileRoute("/_authenticated/provider/")({
  component: ProviderHome,
});

function ProviderHome() {
  const { data, isLoading } = useProviderPortal();
  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const today = todayIso();
  const open = data.jobs.filter((j) => !["completed", "cancelled"].includes(j.status));
  const todays = open.filter((j) => j.requested_date === today);
  const attention = open.filter((j) => j.status === "requested");
  const upcoming = open.filter((j) => j.status !== "requested" && (j.requested_date ?? "") >= today).slice(0, 5);
  const activePlans = data.plans.filter((p) => p.status === "active");
  const completedValue = data.jobs
    .filter((j) => j.status === "completed")
    .reduce((sum, j) => sum + Number(j.quoted_price ?? 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="display-xl text-[2.2rem]">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Today" value={todays.length} hint="Jobs on today's date" />
        <Stat label="Needs attention" value={attention.length} hint="New requests to confirm" />
        <Stat label="Ongoing care" value={activePlans.length} hint="Active recurring customers" />
        <Stat label="Completed value" value={money(completedValue)} hint="From quoted prices" />
      </div>
      <Section title="New requests">
        <div className="divide-y divide-border">
          {attention.slice(0, 5).map((j) => <JobRow key={j.id} data={data} job={j} />)}
          {attention.length === 0 ? <Empty>Nothing waiting on you.</Empty> : null}
        </div>
      </Section>
      <Section title="Next scheduled jobs">
        <div className="divide-y divide-border">
          {upcoming.map((j) => <JobRow key={j.id} data={data} job={j} />)}
          {upcoming.length === 0 ? <Empty>No upcoming jobs yet.</Empty> : null}
        </div>
      </Section>
      <Link to="/provider/jobs" className="inline-flex text-sm font-semibold text-primary">
        See all jobs
      </Link>
    </div>
  );
}
