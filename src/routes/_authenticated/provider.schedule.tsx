import { createFileRoute } from "@tanstack/react-router";

import { Empty, JobRow, Section } from "@/components/provider-portal-ui";
import { todayIso, useProviderPortal } from "@/lib/provider-portal";

export const Route = createFileRoute("/_authenticated/provider/schedule")({
  component: ProviderSchedule,
});

function ProviderSchedule() {
  const { data, isLoading } = useProviderPortal();
  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const today = todayIso();
  const upcoming = data.jobs.filter(
    (j) => j.requested_date && j.requested_date >= today && !["completed", "cancelled"].includes(j.status),
  );
  const byDate = new Map<string, typeof upcoming>();
  for (const j of upcoming) byDate.set(j.requested_date!, [...(byDate.get(j.requested_date!) ?? []), j]);

  return (
    <div className="space-y-6">
      <h1 className="display-xl text-[2.2rem]">Schedule</h1>
      {[...byDate.entries()].map(([date, jobs]) => (
        <Section
          key={date}
          title={new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        >
          <div className="divide-y divide-border">
            {jobs.map((j) => <JobRow key={j.id} data={data} job={j} />)}
          </div>
        </Section>
      ))}
      {byDate.size === 0 ? (
        <Section title="Upcoming">
          <Empty>No upcoming one-time or recurring visits on the calendar.</Empty>
        </Section>
      ) : null}
    </div>
  );
}
