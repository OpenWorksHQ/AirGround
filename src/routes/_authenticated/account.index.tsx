import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button, ButtonLink, Eyebrow, Field, StatusChip, inputStyles, FREQUENCY_LABEL } from "@/components/ag";
import { AccountShell } from "@/components/account-shell";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, isUpcoming, useMyCarePlans, useMyProperties, useMyRequests } from "@/lib/account";

export const Route = createFileRoute("/_authenticated/account/")({
  head: () => ({
    meta: [
      { title: "My Home — AIRGROUND Home Services" },
      { name: "description", content: "Your property, next service and ongoing care in one place." },
      { property: "og:title", content: "My Home — AIRGROUND" },
      { property: "og:description", content: "Your AirGround property and services." },
    ],
  }),
  component: MyHome,
});

function MyHome() {
  const queryClient = useQueryClient();
  const { data: requests } = useMyRequests();
  const { data: properties } = useMyProperties();
  const { data: plans } = useMyCarePlans();

  const property = properties?.[0];
  const upcoming = (requests ?? []).filter(isUpcoming);
  const next = upcoming[0];
  const planItems = (plans ?? []).flatMap((p) => p.care_plan_items ?? []);

  const [editing, setEditing] = useState(false);
  const [lotSize, setLotSize] = useState("");
  const [accessNotes, setAccessNotes] = useState("");
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");

  const startEdit = () => {
    setLotSize(property?.lot_size ?? "");
    setAccessNotes(property?.access_notes ?? "");
    setEditing(true);
  };

  const saveProperty = async () => {
    if (!property) return;
    const { error } = await supabase
      .from("properties")
      .update({ lot_size: lotSize || null, access_notes: accessNotes || null })
      .eq("id", property.id);
    if (error) {
      toast.error("Couldn't save those details.");
      return;
    }
    toast.success("Property details updated.");
    setEditing(false);
    queryClient.invalidateQueries({ queryKey: ["my-properties"] });
  };

  const reschedule = async (id: string) => {
    if (!newDate) return;
    const { error } = await supabase
      .from("service_requests")
      .update({ requested_date: newDate, status: "requested" })
      .eq("id", id);
    if (error) {
      toast.error("Couldn't move that visit.");
      return;
    }
    toast.success("New date requested.");
    setRescheduleId(null);
    setNewDate("");
    queryClient.invalidateQueries({ queryKey: ["my-requests"] });
  };

  return (
    <AccountShell>
      <Eyebrow>My Home</Eyebrow>
      <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <h1 className="display-xl text-[2.4rem]">
          {property ? property.address_line1 : "No property yet"}
        </h1>
        <ButtonLink to="/book" search={{ mode: "once" }}>
          Request another service
        </ButtonLink>
      </div>
      {property ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {[property.city, property.state_code, property.zip].filter(Boolean).join(" · ")}
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          Book your first service and your property will show up here.
        </p>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <span className="eyebrow">Next service</span>
          {next ? (
            <>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-extrabold">{next.service_name}</h2>
                <StatusChip status={next.status} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatDate(next.requested_date)}
                {next.time_window ? ` · ${next.time_window}` : ""}
              </p>
              {rescheduleId === next.id ? (
                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <input
                    type="date"
                    className={`${inputStyles} max-w-[200px]`}
                    min={new Date().toISOString().slice(0, 10)}
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                  <Button onClick={() => reschedule(next.id)}>Request new date</Button>
                  <Button variant="quiet" onClick={() => setRescheduleId(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setRescheduleId(next.id)}>
                  Reschedule
                </Button>
              )}
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Nothing scheduled right now.</p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <span className="eyebrow">Property details</span>
          {editing ? (
            <div className="mt-3 space-y-3">
              <Field label="Property size">
                <input className={inputStyles} value={lotSize} onChange={(e) => setLotSize(e.target.value)} />
              </Field>
              <Field label="Access notes">
                <input
                  className={inputStyles}
                  value={accessNotes}
                  onChange={(e) => setAccessNotes(e.target.value)}
                />
              </Field>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveProperty}>
                  Save
                </Button>
                <Button size="sm" variant="quiet" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Property size</dt>
                  <dd className="font-medium">{property?.lot_size ?? "Not set"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Access notes</dt>
                  <dd className="font-medium">{property?.access_notes ?? "None"}</dd>
                </div>
              </dl>
              {property ? (
                <Button variant="outline" size="sm" className="mt-4" onClick={startEdit}>
                  Update details
                </Button>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Upcoming</span>
            <ButtonLink to="/account/services" variant="quiet" size="sm">
              All services
            </ButtonLink>
          </div>
          <ul className="mt-3 divide-y divide-border">
            {upcoming.slice(0, 5).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{r.service_name}</span>
                  <span className="block text-xs text-muted-foreground">{formatDate(r.requested_date)}</span>
                </span>
                <StatusChip status={r.status} />
              </li>
            ))}
            {upcoming.length === 0 ? (
              <li className="py-3 text-sm text-muted-foreground">No upcoming visits.</li>
            ) : null}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Ongoing care</span>
            <ButtonLink to="/account/home-care" variant="quiet" size="sm">
              Manage
            </ButtonLink>
          </div>
          <ul className="mt-3 divide-y divide-border">
            {planItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                <span className="min-w-0 truncate text-sm font-semibold">{item.service_name}</span>
                <span className="shrink-0 text-xs font-semibold text-primary">
                  {item.paused ? "Paused" : (FREQUENCY_LABEL[item.frequency] ?? item.frequency)}
                </span>
              </li>
            ))}
            {planItems.length === 0 ? (
              <li className="py-3 text-sm text-muted-foreground">
                Nothing on a schedule yet.{" "}
                <ButtonLink to="/book" search={{ mode: "care" }} variant="quiet" size="sm">
                  Build a plan
                </ButtonLink>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </AccountShell>
  );
}
