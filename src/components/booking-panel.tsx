import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, Check, CreditCard, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button, inputStyles } from "@/components/ag";
import { ServiceIcon } from "@/components/service-icon";
import { useCategories } from "@/lib/catalog";
import { loadDraft, saveDraft, type BookingMode } from "@/lib/booking";
import { useLocationArea, zipCovered } from "@/hooks/use-location";
import { supabase } from "@/integrations/supabase/client";

const PANEL_CATEGORIES = 6;

export function BookingPanel() {
  const navigate = useNavigate();
  const { data: categories } = useCategories();
  const { stateCode, setStateCode, areas } = useLocationArea();

  const [mode, setMode] = useState<BookingMode>("once");
  const [zip, setZip] = useState("");
  const [address, setAddress] = useState("");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    const draft = loadDraft();
    if (draft.zip) setZip(draft.zip);
    if (draft.address) setAddress(draft.address);
    if (draft.categorySlug) setPicked(draft.categorySlug);
  }, []);

  const covered = zipCovered(areas, zip);

  const joinWaitlist = async () => {
    if (!waitlistEmail.includes("@")) {
      toast.error("Enter an email we can reach you at.");
      return;
    }
    const { error } = await supabase
      .from("area_waitlist")
      .insert({ email: waitlistEmail, zip: zip.trim().slice(0, 5), state_code: stateCode });
    if (error) {
      toast.error("We couldn't save that. Try again.");
      return;
    }
    setJoined(true);
  };

  const cont = () => {
    if (covered !== true) {
      toast.error("Add a ZIP code inside an active service area first.");
      return;
    }
    if (mode === "once" && !picked) {
      toast.error("Choose what your home needs.");
      return;
    }
    const draft = loadDraft();
    saveDraft({
      ...draft,
      mode,
      stateCode,
      zip: zip.trim().slice(0, 5),
      address,
      categorySlug: mode === "once" ? picked : null,
      serviceId: null,
      serviceName: null,
    });
    navigate({ to: "/book", search: { mode } });
  };

  const list = (categories ?? []).slice(0, PANEL_CATEGORIES);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-panel">
      <div className="grid grid-cols-2">
        {(
          [
            ["once", "Book Once"],
            ["care", "Keep It Scheduled"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={
              mode === value
                ? "border-b-2 border-foreground bg-card py-5 text-sm font-bold text-foreground"
                : "border-b border-border bg-muted py-5 text-sm font-semibold text-muted-foreground hover:text-foreground"
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div className="p-6 sm:p-8">
        {mode === "once" ? (
          <>
            <h2 className="display-xl text-[2rem]">What does your home need?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Check availability and request a service in minutes.
            </p>
          </>
        ) : (
          <>
            <h2 className="display-xl text-[2rem]">Keep Your Home Taken Care Of.</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose what you want maintained and how often. AirGround keeps it on your schedule.
            </p>
          </>
        )}

        <div className="mt-6 space-y-3">
          <select
            aria-label="State"
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value)}
            className={inputStyles}
          >
            {areas.length === 0 ? <option value={stateCode}>Michigan</option> : null}
            {areas.map((a) => (
              <option key={a.id} value={a.state_code}>
                {a.name}
              </option>
            ))}
          </select>

          <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
            <input
              className={inputStyles}
              placeholder="Street address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              autoComplete="street-address"
            />
            <input
              className={inputStyles}
              placeholder="ZIP code"
              inputMode="numeric"
              maxLength={5}
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
              autoComplete="postal-code"
            />
          </div>

          {covered === true ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Check className="h-4 w-4" strokeWidth={1.75} /> Great — we service your area.
            </p>
          ) : null}

          {covered === false ? (
            <div className="rounded-xl border border-border bg-muted p-4">
              <p className="text-sm font-semibold text-foreground">
                AirGround isn't in your area yet.
              </p>
              {joined ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  You're on the list — we'll let you know when we reach {zip}.
                </p>
              ) : (
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input
                    className={inputStyles}
                    placeholder="Email address"
                    type="email"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                  />
                  <Button variant="outline" onClick={joinWaitlist}>
                    Notify me
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {mode === "once" && covered === true ? (
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {list.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setPicked(c.slug)}
                className={
                  picked === c.slug
                    ? "flex flex-col items-center gap-2 rounded-xl border border-primary bg-secondary px-2 py-4 text-center"
                    : "flex flex-col items-center gap-2 rounded-xl border border-border bg-muted px-2 py-4 text-center hover:border-border-strong"
                }
              >
                <ServiceIcon name={c.icon} className="h-6 w-6 text-foreground" />
                <span className="text-xs font-semibold leading-tight">{c.name}</span>
              </button>
            ))}
          </div>
        ) : null}

        <Button size="lg" className="mt-6 w-full" onClick={cont}>
          Continue <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
        </Button>

        <div className="mt-6 grid gap-3 border-t border-border pt-5 text-xs text-muted-foreground sm:grid-cols-3">
          <span className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 shrink-0 text-foreground" strokeWidth={1.25} />
            One-time or ongoing
          </span>
          <span className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 shrink-0 text-foreground" strokeWidth={1.25} />
            Upfront pricing
          </span>
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-foreground" strokeWidth={1.25} />
            Trusted &amp; insured
          </span>
        </div>
      </div>
    </div>
  );
}
