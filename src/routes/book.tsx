import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button, ButtonLink, Field, inputStyles } from "@/components/ag";
import { Logo } from "@/components/brand";
import { ServiceIcon } from "@/components/service-icon";
import { useAuth } from "@/hooks/use-auth";
import { useLocationArea, zipCovered } from "@/hooks/use-location";
import { supabase } from "@/integrations/supabase/client";
import {
  FREQUENCIES,
  TIME_WINDOWS,
  clearDraft,
  loadDraft,
  saveDraft,
  type BookingDraft,
} from "@/lib/booking";
import { useCategories, useServices } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/book")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === "care" ? ("care" as const) : ("once" as const),
  }),
  head: () => ({
    meta: [
      { title: "Request a service — AIRGROUND Home Services" },
      {
        name: "description",
        content: "Tell us what your home needs, pick a date, and AirGround takes it from there.",
      },
      { property: "og:title", content: "Request a service — AIRGROUND" },
      { property: "og:description", content: "Book once or build an ongoing home care plan." },
    ],
  }),
  component: BookPage,
});

const ONCE_STEPS = ["Service", "Details", "Schedule", "Review"];
const CARE_STEPS = ["Services", "Property", "Review"];

const nextDateFor = (frequency: string) => {
  const d = new Date();
  const days =
    { weekly: 7, biweekly: 14, monthly: 30, seasonally: 90, twice_yearly: 180, yearly: 365 }[
      frequency
    ] ?? 30;
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

function Progress({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-3">
          <span
            className={cn(
              "flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em]",
              i === current ? "text-foreground" : i < current ? "text-primary" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "grid h-6 w-6 place-items-center rounded-full border text-[0.65rem]",
                i === current
                  ? "border-foreground"
                  : i < current
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border",
              )}
            >
              {i < current ? <Check className="h-3 w-3" strokeWidth={2.5} /> : i + 1}
            </span>
            {s}
          </span>
          {i < steps.length - 1 ? <span className="h-px w-5 bg-border" /> : null}
        </li>
      ))}
    </ol>
  );
}

function BookPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { areas, stateCode, setStateCode } = useLocationArea();

  const [draft, setDraft] = useState<BookingDraft>(() => loadDraft());
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ number: string | null; care: boolean } | null>(null);

  const steps = mode === "once" ? ONCE_STEPS : CARE_STEPS;

  useEffect(() => {
    const loaded = loadDraft();
    setDraft({ ...loaded, mode, stateCode: loaded.stateCode || stateCode });
  }, [mode, stateCode]);

  const update = (patch: Partial<BookingDraft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      saveDraft(next);
      return next;
    });
  };

  const { data: categories } = useCategories();
  const { data: allServices } = useServices();

  const categoryServices = useMemo(
    () => (allServices ?? []).filter((s) => !draft.categorySlug || s.category_slug === draft.categorySlug),
    [allServices, draft.categorySlug],
  );
  const recurringServices = useMemo(
    () => (allServices ?? []).filter((s) => s.recurring_allowed),
    [allServices],
  );

  const covered = zipCovered(areas, draft.zip);

  const canAdvance = () => {
    if (mode === "once") {
      if (step === 0) return !!draft.serviceId || !!draft.serviceName;
      if (step === 1) return draft.address.trim().length > 3 && covered === true;
      if (step === 2) return !!draft.requestedDate && !!draft.timeWindow;
      return true;
    }
    if (step === 0) return draft.carePicks.length > 0;
    if (step === 1) return draft.address.trim().length > 3 && covered === true;
    return true;
  };

  const submit = async () => {
    if (!user) return;
    setBusy(true);
    try {
      // Reuse the matching property, or add it to the account.
      const { data: existing } = await supabase
        .from("properties")
        .select("id")
        .eq("user_id", user.id)
        .eq("address_line1", draft.address)
        .eq("zip", draft.zip)
        .maybeSingle();

      let propertyId = existing?.id ?? null;
      if (!propertyId) {
        const { data: created, error } = await supabase
          .from("properties")
          .insert({
            user_id: user.id,
            address_line1: draft.address,
            city: draft.city || null,
            state_code: draft.stateCode || "MI",
            zip: draft.zip,
            lot_size: draft.lotSize || null,
            access_notes: draft.accessNotes || null,
          })
          .select("id")
          .single();
        if (error) throw error;
        propertyId = created.id;
      }

      if (mode === "once") {
        const { data, error } = await supabase
          .from("service_requests")
          .insert({
            user_id: user.id,
            property_id: propertyId,
            category_slug: draft.categorySlug,
            service_id: draft.serviceId,
            service_name: draft.serviceName ?? "Service request",
            description: draft.description || null,
            requested_date: draft.requestedDate || null,
            time_window: draft.timeWindow || null,
            estimate_note: "Estimate confirmed after review",
          })
          .select("request_number")
          .single();
        if (error) throw error;
        clearDraft();
        setDone({ number: data.request_number, care: false });
      } else {
        const { data: plan, error: planError } = await supabase
          .from("care_plans")
          .insert({ user_id: user.id, property_id: propertyId })
          .select("id")
          .single();
        if (planError) throw planError;

        const { error: itemsError } = await supabase.from("care_plan_items").insert(
          draft.carePicks.map((p) => ({
            care_plan_id: plan.id,
            service_id: p.serviceId,
            service_name: p.serviceName,
            frequency: p.frequency as never,
            next_service_date: nextDateFor(p.frequency),
          })),
        );
        if (itemsError) throw itemsError;

        // Prepare the first upcoming occurrence for each recurring service.
        const { error: occError } = await supabase.from("service_requests").insert(
          draft.carePicks.map((p) => ({
            user_id: user.id,
            property_id: propertyId,
            service_id: p.serviceId,
            service_name: p.serviceName,
            requested_date: nextDateFor(p.frequency),
            status: "scheduled" as never,
            care_plan_id: plan.id,
            estimate_note: "Part of your ongoing care plan",
          })),
        );
        if (occError) throw occError;

        clearDraft();
        setDone({ number: null, care: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "We couldn't send that. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Shell>
        <div className="mx-auto max-w-xl py-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-6 w-6" strokeWidth={2} />
          </span>
          <h1 className="display-xl mt-6 text-[2.4rem]">
            {done.care ? "Your home care plan is set." : "Your AirGround service is requested."}
          </h1>
          {done.number ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Request <span className="font-bold text-foreground">{done.number}</span>
            </p>
          ) : null}
          <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-left">
            <span className="eyebrow">What happens next</span>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>1. We review the details and confirm pricing.</li>
              <li>
                2. {done.care
                  ? "Your first visits are placed on the calendar."
                  : "You get a confirmation for your requested date and window."}
              </li>
              <li>3. Everything stays visible in your account.</li>
            </ol>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink to="/account" size="lg">
              Go to My Home
            </ButtonLink>
            <ButtonLink to="/services" variant="outline" size="lg">
              Browse services
            </ButtonLink>
          </div>
        </div>
      </Shell>
    );
  }

  const isLast = step === steps.length - 1;

  return (
    <Shell>
      <div className="mb-8 flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <Progress steps={steps} current={step} />
        <div className="flex gap-2">
          <Link
            to="/book"
            search={{ mode: "once" }}
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider",
              mode === "once" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Book Once
          </Link>
          <Link
            to="/book"
            search={{ mode: "care" }}
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider",
              mode === "care" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Keep It Scheduled
          </Link>
        </div>
      </div>

      {/* ---------- BOOK ONCE ---------- */}
      {mode === "once" && step === 0 ? (
        <div>
          <h1 className="display-xl text-[2.2rem]">What should we take care of?</h1>
          <div className="mt-6 flex flex-wrap gap-2">
            {(categories ?? []).map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => update({ categorySlug: c.slug, serviceId: null, serviceName: null })}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold",
                  draft.categorySlug === c.slug
                    ? "border-primary bg-secondary text-primary"
                    : "border-border text-foreground hover:border-border-strong",
                )}
              >
                <ServiceIcon name={c.icon} className="h-4 w-4" />
                {c.name}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {categoryServices.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => update({ serviceId: s.id, serviceName: s.name })}
                className={cn(
                  "rounded-xl border p-4 text-left",
                  draft.serviceId === s.id
                    ? "border-primary bg-secondary"
                    : "border-border bg-card hover:border-border-strong",
                )}
              >
                <span className="block text-sm font-bold">{s.name}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{s.summary}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => update({ serviceId: null, serviceName: "I'm not sure yet" })}
              className={cn(
                "rounded-xl border p-4 text-left",
                draft.serviceName === "I'm not sure yet"
                  ? "border-primary bg-secondary"
                  : "border-border bg-card hover:border-border-strong",
              )}
            >
              <span className="block text-sm font-bold">I'm not sure</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Describe it and we'll pick the right service — no diagnosing needed.
              </span>
            </button>
          </div>
        </div>
      ) : null}

      {mode === "once" && step === 1 ? (
        <div className="max-w-xl">
          <h1 className="display-xl text-[2.2rem]">A few details.</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Only what we need for {draft.serviceName}.
          </p>
          <div className="mt-6 space-y-4">
            <PropertyFields draft={draft} update={update} covered={covered} areas={areas} setStateCode={setStateCode} />
            <Field label="What's going on?" hint="A sentence or two is plenty.">
              <textarea
                className={`${inputStyles} h-28 py-3`}
                value={draft.description}
                onChange={(e) => update({ description: e.target.value })}
                placeholder="Back lawn is overgrown and the AC is running warm."
              />
            </Field>
          </div>
        </div>
      ) : null}

      {mode === "once" && step === 2 ? (
        <div className="max-w-xl">
          <h1 className="display-xl text-[2.2rem]">When works?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This is a requested date and window. We confirm it once AirGround accepts the request.
          </p>
          <div className="mt-6 space-y-5">
            <Field label="Requested date">
              <input
                type="date"
                className={inputStyles}
                min={new Date().toISOString().slice(0, 10)}
                value={draft.requestedDate}
                onChange={(e) => update({ requestedDate: e.target.value })}
              />
            </Field>
            <div>
              <span className="eyebrow">Service window</span>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {TIME_WINDOWS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => update({ timeWindow: w })}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-xs font-semibold",
                      draft.timeWindow === w
                        ? "border-primary bg-secondary text-primary"
                        : "border-border bg-card hover:border-border-strong",
                    )}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ---------- KEEP IT SCHEDULED ---------- */}
      {mode === "care" && step === 0 ? (
        <div>
          <h1 className="display-xl text-[2.2rem]">Keep Your Home Taken Care Of.</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Choose what you want maintained and how often. Everything you pick lives under one plan
            for your address.
          </p>
          <div className="mt-6 space-y-2">
            {recurringServices.map((s) => {
              const pick = draft.carePicks.find((p) => p.serviceId === s.id);
              return (
                <div
                  key={s.id}
                  className={cn(
                    "grid gap-3 rounded-xl border p-4 sm:grid-cols-[minmax(0,1fr)_200px] sm:items-center",
                    pick ? "border-primary bg-secondary" : "border-border bg-card",
                  )}
                >
                  <button
                    type="button"
                    className="min-w-0 text-left"
                    onClick={() =>
                      update({
                        carePicks: pick
                          ? draft.carePicks.filter((p) => p.serviceId !== s.id)
                          : [
                              ...draft.carePicks,
                              {
                                serviceId: s.id,
                                serviceName: s.name,
                                frequency: s.default_frequency ?? "monthly",
                              },
                            ],
                      })
                    }
                  >
                    <span className="flex items-center gap-2 text-sm font-bold">
                      <span
                        className={cn(
                          "grid h-5 w-5 shrink-0 place-items-center rounded border",
                          pick ? "border-primary bg-primary text-primary-foreground" : "border-border-strong",
                        )}
                      >
                        {pick ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                      </span>
                      {s.name}
                    </span>
                    <span className="mt-1 block pl-7 text-xs text-muted-foreground">{s.summary}</span>
                  </button>
                  {pick ? (
                    <select
                      aria-label={`How often for ${s.name}`}
                      className={inputStyles}
                      value={pick.frequency}
                      onChange={(e) =>
                        update({
                          carePicks: draft.carePicks.map((p) =>
                            p.serviceId === s.id ? { ...p, frequency: e.target.value } : p,
                          ),
                        })
                      }
                    >
                      {FREQUENCIES.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {mode === "care" && step === 1 ? (
        <div className="max-w-xl">
          <h1 className="display-xl text-[2.2rem]">Which home?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your plan is tied to this address. You can add another later.
          </p>
          <div className="mt-6 space-y-4">
            <PropertyFields draft={draft} update={update} covered={covered} areas={areas} setStateCode={setStateCode} />
          </div>
        </div>
      ) : null}

      {/* ---------- REVIEW ---------- */}
      {isLast ? (
        <div className="max-w-xl">
          <h1 className="display-xl text-[2.2rem]">Review and confirm.</h1>
          <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
            {mode === "once" ? (
              <>
                <Row label="Service" value={draft.serviceName ?? "—"} />
                <Row label="Address" value={`${draft.address}${draft.city ? `, ${draft.city}` : ""} ${draft.zip}`} />
                <Row
                  label="Requested date"
                  value={`${draft.requestedDate || "—"} · ${draft.timeWindow || "—"}`}
                />
                <Row label="Details" value={draft.description || "—"} />
                <Row label="Pricing" value="Estimate confirmed after review" />
                <Row label="Type" value="One-time service" />
              </>
            ) : (
              <>
                {draft.carePicks.map((p) => (
                  <Row
                    key={p.serviceId}
                    label={p.serviceName}
                    value={FREQUENCIES.find((f) => f.value === p.frequency)?.label ?? p.frequency}
                  />
                ))}
                <Row label="Address" value={`${draft.address}${draft.city ? `, ${draft.city}` : ""} ${draft.zip}`} />
                <Row label="Type" value="Ongoing care plan" />
              </>
            )}
          </div>

          {user ? (
            <Button size="lg" className="mt-6 w-full" onClick={submit} disabled={busy}>
              {busy ? "Sending…" : mode === "once" ? "Request Service" : "Start My Home Care Plan"}
            </Button>
          ) : (
            <div className="mt-6 rounded-2xl border border-border bg-muted p-5">
              <p className="text-sm font-bold">One step left — your account.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                So you can track this request, reschedule it and see what's coming next. Everything
                you entered is saved.
              </p>
              <ButtonLink
                to="/login"
                search={{ redirect: mode === "care" ? "/book?mode=care" : "/book?mode=once" }}
                size="lg"
                className="mt-4 w-full"
              >
                Sign in or create an account
              </ButtonLink>
            </div>
          )}
        </div>
      ) : null}

      {/* NAV */}
      <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
        <Button
          variant="quiet"
          onClick={() => (step === 0 ? navigate({ to: "/" }) : setStep(step - 1))}
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> Back
        </Button>
        {!isLast ? (
          <Button
            size="lg"
            onClick={() => {
              if (!canAdvance()) {
                toast.error("Fill in this step to continue.");
                return;
              }
              setStep(step + 1);
            }}
          >
            Continue <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
          </Button>
        ) : null}
      </div>
    </Shell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 px-6 py-4 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-4">
      <span className="eyebrow">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function PropertyFields({
  draft,
  update,
  covered,
  areas,
  setStateCode,
}: {
  draft: BookingDraft;
  update: (patch: Partial<BookingDraft>) => void;
  covered: boolean | null;
  areas: { id: string; state_code: string; name: string }[];
  setStateCode: (code: string) => void;
}) {
  return (
    <>
      <Field label="State">
        <select
          className={inputStyles}
          value={draft.stateCode}
          onChange={(e) => {
            setStateCode(e.target.value);
            update({ stateCode: e.target.value });
          }}
        >
          {areas.length === 0 ? <option value={draft.stateCode}>Michigan</option> : null}
          {areas.map((a) => (
            <option key={a.id} value={a.state_code}>
              {a.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Street address">
        <input
          className={inputStyles}
          value={draft.address}
          onChange={(e) => update({ address: e.target.value })}
          autoComplete="street-address"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City">
          <input
            className={inputStyles}
            value={draft.city}
            onChange={(e) => update({ city: e.target.value })}
          />
        </Field>
        <Field label="ZIP code">
          <input
            className={inputStyles}
            inputMode="numeric"
            maxLength={5}
            value={draft.zip}
            onChange={(e) => update({ zip: e.target.value.replace(/\D/g, "") })}
          />
        </Field>
      </div>
      {covered === false ? (
        <p className="text-sm font-semibold text-destructive">
          AirGround isn't in {draft.zip} yet — try another address in an active area.
        </p>
      ) : null}
      {covered === true ? (
        <p className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Check className="h-4 w-4" strokeWidth={1.75} /> We service your area.
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Property size" hint="Optional">
          <input
            className={inputStyles}
            value={draft.lotSize}
            onChange={(e) => update({ lotSize: e.target.value })}
            placeholder="Approx. 1/4 acre"
          />
        </Field>
        <Field label="Access notes" hint="Optional">
          <input
            className={inputStyles}
            value={draft.accessNotes}
            onChange={(e) => update({ accessNotes: e.target.value })}
            placeholder="Gate code, dog in yard…"
          />
        </Field>
      </div>
    </>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="mx-auto flex max-w-[1000px] items-center justify-between px-5 py-5 lg:px-10">
          <Logo />
          <Link to="/" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
            Save &amp; exit
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-[1000px] px-5 py-10 lg:px-10">{children}</div>
    </div>
  );
}
