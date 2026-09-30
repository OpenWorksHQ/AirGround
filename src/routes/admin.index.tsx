import { createFileRoute, Link } from "@tanstack/react-router";

import { StatusChip } from "@/components/ag";
import { formatDate } from "@/lib/account";
import { useAdminCustomers, useAdminPlanItems, useAdminRequests } from "@/lib/admin";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: requests } = useAdminRequests();
  const { data: customers } = useAdminCustomers();
  const { data: planItems } = useAdminPlanItems();

  const all = requests ?? [];
  const open = all.filter((r) => !["completed", "cancelled"].includes(r.status));
  const newRequests = all.filter((r) => r.status === "requested");
  const activeCare = (planItems ?? []).filter((i) => !i.paused);

  return (
    <div>
      <h1 className="display-xl text-[2.2rem]">Today at AirGround</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="New requests" value={newRequests.length} to="/admin/requests" />
        <Stat label="Open jobs" value={open.length} to="/admin/schedule" />
        <Stat label="Care services scheduled" value={activeCare.length} to="/admin/requests" />
        <Stat label="Customers" value={(customers ?? []).length} to="/admin/customers" />
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-card">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <span className="eyebrow">Needs attention</span>
          <Link to="/admin/requests" className="text-sm font-semibold text-primary">
            All requests
          </Link>
        </header>
        <div className="divide-y divide-border">
          {newRequests.slice(0, 8).map((r) => (
            <div key={r.id} className="grid gap-2 px-6 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{r.service_name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.request_number} · {formatDate(r.requested_date)}
                  {r.time_window ? ` · ${r.time_window}` : ""}
                </p>
              </div>
              <StatusChip status={r.status} />
            </div>
          ))}
          {newRequests.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">Everything is triaged.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, to }: { label: string; value: number; to: string }) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-border-strong"
    >
      <span className="eyebrow">{label}</span>
      <p className="mt-2 text-4xl font-extrabold tracking-tight">{value}</p>
    </Link>
  );
}
