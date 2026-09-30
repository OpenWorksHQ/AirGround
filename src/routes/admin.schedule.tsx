import { createFileRoute } from "@tanstack/react-router";

import { StatusChip } from "@/components/ag";
import { formatDate } from "@/lib/account";
import { useAdminCustomers, useAdminProperties, useAdminRequests } from "@/lib/admin";

export const Route = createFileRoute("/admin/schedule")({
  component: AdminSchedule,
});

function AdminSchedule() {
  const { data: requests } = useAdminRequests();
  const { data: customers } = useAdminCustomers();
  const { data: properties } = useAdminProperties();

  const scheduled = (requests ?? [])
    .filter((r) => !["completed", "cancelled"].includes(r.status))
    .sort((a, b) => (a.requested_date ?? "9999").localeCompare(b.requested_date ?? "9999"));

  const groups = new Map<string, typeof scheduled>();
  for (const r of scheduled) {
    const key = r.requested_date ?? "unscheduled";
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }

  return (
    <div>
      <h1 className="display-xl text-[2.2rem]">Schedule</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Every open job by day, including visits still waiting on a date.
      </p>

      <div className="mt-6 space-y-4">
        {[...groups.entries()].map(([date, rows]) => (
          <section key={date} className="rounded-2xl border border-border bg-card">
            <header className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-sm font-bold">
                {date === "unscheduled" ? "Awaiting a date" : formatDate(date)}
              </h2>
              <span className="text-xs text-muted-foreground">{rows.length} job(s)</span>
            </header>
            <div className="divide-y divide-border">
              {rows.map((r) => {
                const customer = (customers ?? []).find((c) => c.id === r.user_id);
                const property = (properties ?? []).find((p) => p.id === r.property_id);
                return (
                  <div
                    key={r.id}
                    className="grid gap-2 px-6 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{r.service_name}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {r.time_window ?? "Window not set"} ·{" "}
                        {property ? `${property.address_line1}, ${property.city ?? ""}` : "No address"} ·{" "}
                        {customer?.full_name ?? customer?.email ?? "Customer"}
                      </p>
                    </div>
                    <StatusChip status={r.status} />
                  </div>
                );
              })}
            </div>
          </section>
        ))}
        {scheduled.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card px-6 py-5 text-sm text-muted-foreground">
            Nothing on the calendar.
          </p>
        ) : null}
      </div>
    </div>
  );
}
