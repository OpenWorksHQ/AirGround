import { createFileRoute } from "@tanstack/react-router";

import { Eyebrow, StatusChip } from "@/components/ag";
import { AccountShell } from "@/components/account-shell";
import { formatDate, useMyRequests } from "@/lib/account";

export const Route = createFileRoute("/_authenticated/account/payments")({
  head: () => ({
    meta: [
      { title: "Payments — My AIRGROUND Account" },
      { name: "description", content: "Charges and estimates for your AirGround services." },
      { property: "og:title", content: "Payments — AIRGROUND" },
      { property: "og:description", content: "Charges and estimates for your AirGround services." },
    ],
  }),
  component: Payments,
});

function Payments() {
  const { data: requests } = useMyRequests();
  const billable = (requests ?? []).filter((r) => r.status === "completed" || r.status === "scheduled");

  return (
    <AccountShell>
      <Eyebrow>Payments</Eyebrow>
      <h1 className="display-xl mt-4 text-[2.4rem]">Charges and estimates.</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Every service shows its estimate here before work happens, and its final amount once it's
        complete. Card payments aren't switched on yet — we invoice after each visit.
      </p>

      <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
        {billable.map((r) => (
          <div key={r.id} className="grid gap-2 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{r.service_name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {r.request_number} · {formatDate(r.requested_date)} ·{" "}
                {r.estimate_note ?? "Estimate pending"}
              </p>
            </div>
            <StatusChip status={r.status} />
          </div>
        ))}
        {billable.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">Nothing to show yet.</p>
        ) : null}
      </div>
    </AccountShell>
  );
}
