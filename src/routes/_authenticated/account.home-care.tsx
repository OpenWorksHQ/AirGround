import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button, ButtonLink, Eyebrow, inputStyles } from "@/components/ag";
import { AccountShell } from "@/components/account-shell";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, useMyCarePlans, useMyProperties } from "@/lib/account";
import { FREQUENCIES } from "@/lib/booking";
import { useServices } from "@/lib/catalog";

export const Route = createFileRoute("/_authenticated/account/home-care")({
  head: () => ({
    meta: [
      { title: "Ongoing Care — My AIRGROUND Account" },
      { name: "description", content: "Change frequency, pause a service or add another to your home care plan." },
      { property: "og:title", content: "Ongoing Care — AIRGROUND" },
      { property: "og:description", content: "Manage the services AirGround keeps scheduled." },
    ],
  }),
  component: HomeCare,
});

function HomeCare() {
  const queryClient = useQueryClient();
  const { data: plans } = useMyCarePlans();
  const { data: properties } = useMyProperties();
  const { data: services } = useServices();
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newServiceId, setNewServiceId] = useState("");
  const [newFrequency, setNewFrequency] = useState("monthly");

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["my-care-plans"] });
  const recurring = (services ?? []).filter((s) => s.recurring_allowed);

  const setFrequency = async (id: string, frequency: string) => {
    const { error } = await supabase
      .from("care_plan_items")
      .update({ frequency: frequency as never })
      .eq("id", id);
    if (error) {
      toast.error("Couldn't change that schedule.");
      return;
    }
    toast.success("Schedule updated.");
    refresh();
  };

  const togglePause = async (id: string, paused: boolean) => {
    const { error } = await supabase.from("care_plan_items").update({ paused: !paused }).eq("id", id);
    if (error) {
      toast.error("Couldn't update that service.");
      return;
    }
    toast.success(paused ? "Service resumed." : "Service paused.");
    refresh();
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase.from("care_plan_items").delete().eq("id", id);
    if (error) {
      toast.error("Couldn't remove that service.");
      return;
    }
    toast.success("Removed from your plan.");
    refresh();
  };

  const addItem = async (planId: string) => {
    const service = recurring.find((s) => s.id === newServiceId);
    if (!service) {
      toast.error("Pick a service to add.");
      return;
    }
    const { error } = await supabase.from("care_plan_items").insert({
      care_plan_id: planId,
      service_id: service.id,
      service_name: service.name,
      frequency: newFrequency as never,
    });
    if (error) {
      toast.error("Couldn't add that service.");
      return;
    }
    toast.success(`${service.name} added to your plan.`);
    setAddingTo(null);
    setNewServiceId("");
    refresh();
  };

  return (
    <AccountShell>
      <Eyebrow>Ongoing Care</Eyebrow>
      <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <h1 className="display-xl text-[2.4rem]">What we keep scheduled.</h1>
        <ButtonLink to="/book" search={{ mode: "care" }} variant="outline">
          New plan
        </ButtonLink>
      </div>

      {(plans ?? []).length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-base font-bold">You don't have a home care plan yet.</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Pick the services you want maintained and how often. We keep them on the calendar.
          </p>
          <ButtonLink to="/book" search={{ mode: "care" }} size="lg" className="mt-5">
            Build My Home Care Plan
          </ButtonLink>
        </div>
      ) : null}

      {(plans ?? []).map((plan) => {
        const property = (properties ?? []).find((p) => p.id === plan.property_id);
        return (
          <section key={plan.id} className="mt-8 rounded-2xl border border-border bg-card">
            <header className="border-b border-border px-6 py-5">
              <span className="eyebrow">Home care plan</span>
              <h2 className="mt-1 text-xl font-extrabold">
                {property ? property.address_line1 : "Your property"}
              </h2>
            </header>

            <ul className="divide-y divide-border">
              {(plan.care_plan_items ?? []).map((item) => (
                <li
                  key={item.id}
                  className="grid gap-3 px-6 py-5 lg:grid-cols-[minmax(0,1fr)_200px_auto] lg:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{item.service_name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.paused ? "Paused" : `Next: ${formatDate(item.next_service_date)}`}
                    </p>
                  </div>
                  <select
                    aria-label={`Frequency for ${item.service_name}`}
                    className={inputStyles}
                    value={item.frequency}
                    onChange={(e) => setFrequency(item.id, e.target.value)}
                  >
                    {FREQUENCIES.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => togglePause(item.id, item.paused)}>
                      {item.paused ? "Resume" : "Pause"}
                    </Button>
                    <Button variant="quiet" size="sm" onClick={() => removeItem(item.id)}>
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
              {(plan.care_plan_items ?? []).length === 0 ? (
                <li className="px-6 py-5 text-sm text-muted-foreground">
                  No services on this plan yet.
                </li>
              ) : null}
            </ul>

            <div className="border-t border-border px-6 py-5">
              {addingTo === plan.id ? (
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
                  <select
                    aria-label="Service to add"
                    className={inputStyles}
                    value={newServiceId}
                    onChange={(e) => setNewServiceId(e.target.value)}
                  >
                    <option value="">Choose a service…</option>
                    {recurring.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Frequency"
                    className={inputStyles}
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value)}
                  >
                    {FREQUENCIES.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <Button onClick={() => addItem(plan.id)}>Add</Button>
                    <Button variant="quiet" onClick={() => setAddingTo(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setAddingTo(plan.id)}>
                  Add another service
                </Button>
              )}
            </div>
          </section>
        );
      })}
    </AccountShell>
  );
}
