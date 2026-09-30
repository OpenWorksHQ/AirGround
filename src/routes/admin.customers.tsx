import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { inputStyles } from "@/components/ag";
import { useAdminCustomers, useAdminProperties, useAdminRequests } from "@/lib/admin";

export const Route = createFileRoute("/admin/customers")({
  component: AdminCustomers,
});

function AdminCustomers() {
  const { data: customers } = useAdminCustomers();
  const { data: properties } = useAdminProperties();
  const { data: requests } = useAdminRequests();
  const [q, setQ] = useState("");

  const term = q.trim().toLowerCase();
  const rows = (customers ?? []).filter((c) =>
    term
      ? `${c.full_name ?? ""} ${c.email ?? ""} ${c.phone ?? ""}`.toLowerCase().includes(term)
      : true,
  );

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <h1 className="display-xl text-[2.2rem]">Customers</h1>
        <input
          className={`${inputStyles} sm:w-[260px]`}
          placeholder="Search name, email or phone"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
        {rows.map((c) => {
          const theirProperties = (properties ?? []).filter((p) => p.user_id === c.id);
          const theirRequests = (requests ?? []).filter((r) => r.user_id === c.id);
          const openCount = theirRequests.filter(
            (r) => !["completed", "cancelled"].includes(r.status),
          ).length;
          return (
            <div key={c.id} className="grid gap-2 px-6 py-4 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{c.full_name ?? "No name given"}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {c.email ?? "No email"}
                  {c.phone ? ` · ${c.phone}` : ""}
                </p>
                {theirProperties.map((p) => (
                  <p key={p.id} className="mt-1 truncate text-xs text-muted-foreground">
                    {p.address_line1}, {p.city ?? ""} {p.state_code} {p.zip}
                  </p>
                ))}
              </div>
              <p className="shrink-0 text-xs font-semibold text-primary">
                {theirRequests.length} service(s) · {openCount} open
              </p>
            </div>
          );
        })}
        {rows.length === 0 ? (
          <p className="px-6 py-5 text-sm text-muted-foreground">No customers match that search.</p>
        ) : null}
      </div>
    </div>
  );
}
