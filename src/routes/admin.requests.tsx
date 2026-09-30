import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button, StatusChip, inputStyles } from "@/components/ag";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_FLOW, useAdminCustomers, useAdminProperties, useAdminRequests } from "@/lib/admin";
import { TIME_WINDOWS } from "@/lib/booking";

export const Route = createFileRoute("/admin/requests")({
  component: AdminRequests,
});

function AdminRequests() {
  const queryClient = useQueryClient();
  const { data: requests } = useAdminRequests();
  const { data: customers } = useAdminCustomers();
  const { data: properties } = useAdminProperties();
  const [filter, setFilter] = useState("open");
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = (requests ?? []).filter((r) =>
    filter === "all"
      ? true
      : filter === "open"
        ? !["completed", "cancelled"].includes(r.status)
        : r.status === filter,
  );

  const update = async (id: string, patch: Record<string, unknown>) => {
    const { error } = await supabase
      .from("service_requests")
      .update(patch as never)
      .eq("id", id);
    if (error) {
      toast.error("Couldn't save that change.");
      return;
    }
    toast.success("Request updated.");
    queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
  };

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <h1 className="display-xl text-[2.2rem]">Requests</h1>
        <select
          aria-label="Filter requests"
          className={`${inputStyles} sm:w-[200px]`}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="open">Open</option>
          <option value="all">All</option>
          {STATUS_FLOW.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
        {rows.map((r) => {
          const customer = (customers ?? []).find((c) => c.id === r.user_id);
          const property = (properties ?? []).find((p) => p.id === r.property_id);
          const expanded = openId === r.id;
          return (
            <div key={r.id} className="px-6 py-4">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_auto] lg:items-center">
                <button
                  className="min-w-0 text-left"
                  onClick={() => setOpenId(expanded ? null : r.id)}
                >
                  <p className="truncate text-sm font-bold">
                    {r.service_name}
                    {r.care_plan_id ? " · ongoing care" : ""}
                    {(r as { provider_slug?: string | null }).provider_slug
                      ? ` · via ${(r as { provider_slug?: string | null }).provider_slug}`
                      : ""}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {r.request_number} · {customer?.full_name ?? customer?.email ?? "Customer"} ·{" "}
                    {property ? `${property.address_line1}, ${property.zip}` : "No address"}
                  </p>
                </button>
                <select
                  aria-label={`Status for ${r.request_number}`}
                  className={inputStyles}
                  value={r.status}
                  onChange={(e) => update(r.id, { status: e.target.value })}
                >
                  {STATUS_FLOW.map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
                <StatusChip status={r.status} />
              </div>

              {expanded ? (
                <div className="mt-4 grid gap-3 rounded-xl bg-paper p-4 lg:grid-cols-3">
                  <label className="block">
                    <span className="eyebrow">Date</span>
                    <input
                      type="date"
                      className={`${inputStyles} mt-2`}
                      value={r.requested_date ?? ""}
                      onChange={(e) => update(r.id, { requested_date: e.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="eyebrow">Arrival window</span>
                    <select
                      className={`${inputStyles} mt-2`}
                      value={r.time_window ?? ""}
                      onChange={(e) => update(r.id, { time_window: e.target.value })}
                    >
                      <option value="">Not set</option>
                      {TIME_WINDOWS.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="eyebrow">Estimate note</span>
                    <input
                      className={`${inputStyles} mt-2`}
                      defaultValue={r.estimate_note ?? ""}
                      placeholder="e.g. $180 — quoted on site"
                      onBlur={(e) => {
                        if (e.target.value !== (r.estimate_note ?? "")) {
                          update(r.id, { estimate_note: e.target.value || null });
                        }
                      }}
                    />
                  </label>
                  {r.description ? (
                    <p className="text-sm text-muted-foreground lg:col-span-3">
                      <span className="font-semibold text-foreground">Customer notes: </span>
                      {r.description}
                    </p>
                  ) : null}
                  <div className="lg:col-span-3">
                    <Button variant="quiet" size="sm" onClick={() => setOpenId(null)}>
                      Close
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
        {rows.length === 0 ? (
          <p className="px-6 py-5 text-sm text-muted-foreground">No requests match this filter.</p>
        ) : null}
      </div>
    </div>
  );
}
