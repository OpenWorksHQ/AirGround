import type { ReactNode } from "react";

import { StatusChip } from "@/components/ag";
import { money, type PortalData, type PortalJob } from "@/lib/provider-portal";

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <span className="eyebrow">{label}</span>
      <p className="display-xl mt-2 text-[2rem]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="border-b border-border px-6 py-4">
        <h2 className="text-sm font-bold">{title}</h2>
      </header>
      {children}
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-6 py-5 text-sm text-muted-foreground">{children}</p>;
}

export function jobContext(data: PortalData, job: PortalJob) {
  const customer = data.customers.find((c) => c.id === job.user_id);
  const property = data.properties.find((p) => p.id === job.property_id);
  return {
    customerName: customer?.full_name ?? customer?.email ?? "Customer",
    customer,
    address: property ? `${property.address_line1}${property.city ? `, ${property.city}` : ""} ${property.zip}` : "No address",
  };
}

export function JobRow({ data, job, actions }: { data: PortalData; job: PortalJob; actions?: ReactNode }) {
  const ctx = jobContext(data, job);
  return (
    <div className="grid gap-3 px-6 py-4 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">
          {job.service_name}
          {job.care_plan_id ? " · ongoing care" : ""}
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {job.request_number} · {ctx.customerName} · {ctx.address}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {job.requested_date ?? "Date not set"}
          {job.time_window ? ` · ${job.time_window}` : ""} · {money(job.quoted_price)}
        </p>
      </div>
      {actions}
      <StatusChip status={job.status} />
    </div>
  );
}
