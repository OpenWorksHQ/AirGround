import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button, Field, inputStyles } from "@/components/ag";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { submitProviderApplication } from "@/lib/providers.functions";
import type { Service } from "@/lib/catalog";

export const Route = createFileRoute("/providers/apply")({
  head: () => ({
    meta: [
      { title: "Join AirGround — Provider Application" },
      {
        name: "description",
        content:
          "Apply to join AirGround as a home-service provider. Applications are reviewed by the AirGround team.",
      },
      { property: "og:title", content: "Join AirGround — Provider Application" },
      {
        property: "og:description",
        content: "Apply to offer your services through AirGround.",
      },
    ],
  }),
  component: ProviderApplyPage,
});

function ProviderApplyPage() {
  const { user } = useAuth();
  const { data: services } = useQuery({
    queryKey: ["catalog-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Service[];
    },
  });

  const [form, setForm] = useState({
    fullName: "",
    businessName: "",
    email: "",
    phone: "",
    primaryTrade: "",
    additionalServices: "",
    city: "",
    stateCode: "MI",
    serviceArea: "",
    licenseInfo: "",
    password: "",
  });
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fail = (msg: string) => {
      toast.error(msg);
      return;
    };
    if (form.fullName.trim().length < 2) return fail("Enter your full name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) return fail("Enter a valid email.");
    if (form.phone.trim().length < 7) return fail("Enter a valid phone number.");
    if (!form.primaryTrade) return fail("Choose your primary trade.");
    if (form.city.trim().length < 2) return fail("Enter your city.");
    if (form.serviceArea.trim().length < 2) return fail("Enter your service area.");
    let userId = user?.id ?? null;
    if (!userId) {
      if (form.password.length < 8) return fail("Create a password of at least 8 characters.");
      setBusy(true);
      const { data: signedUp, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: { data: { full_name: form.fullName.trim() } },
      });
      if (signUpError) {
        setBusy(false);
        return fail(
          signUpError.message.includes("already")
            ? "An AirGround account already uses this email. Sign in first, then apply."
            : signUpError.message.includes("weak_password")
              ? "That password is too easy to guess. Choose a longer one with numbers and symbols."
              : signUpError.message,
        );
      }
      userId = signedUp.user?.id ?? null;
    }
    setBusy(true);
    try {
      await submitProviderApplication({
        data: {
          userId,
          fullName: form.fullName.trim(),
          businessName: form.businessName.trim() || null,
          email: form.email.trim(),
          phone: form.phone.trim(),
          primaryTrade: form.primaryTrade,
          additionalServices: form.additionalServices.trim() || null,
          city: form.city.trim(),
          stateCode: form.stateCode.trim().toUpperCase() || "MI",
          serviceArea: form.serviceArea.trim(),
          licenseInfo: form.licenseInfo.trim() || null,
        },
      });
      setSubmitted(true);
    } catch {
      toast.error("Couldn't submit your application. Please try again.");
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-12 lg:px-10">
          <h1 className="display-xl text-[2.4rem] sm:text-[3rem]">Join AirGround</h1>
          <p className="mt-3 max-w-xl text-[0.95rem] text-muted-foreground">
            Tell us about your business. The AirGround team reviews every application
            before your Provider Page goes live.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-10 lg:px-10">
        {submitted ? (
          <div className="max-w-xl rounded-2xl border border-border bg-card p-8">
            <h2 className="text-xl font-bold">Application received</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Your application is in Pending Review. The AirGround team will review it
              and follow up by email. Once approved, your Provider Dashboard and
              Provider Page will be ready.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="max-w-2xl space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name">
                <input className={inputStyles} value={form.fullName} onChange={(e) => set({ fullName: e.target.value })} autoComplete="name" />
              </Field>
              <Field label="Business name" hint="Optional">
                <input className={inputStyles} value={form.businessName} onChange={(e) => set({ businessName: e.target.value })} />
              </Field>
              <Field label="Email">
                <input className={inputStyles} type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} autoComplete="email" />
              </Field>
              <Field label="Phone">
                <input className={inputStyles} type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} autoComplete="tel" />
              </Field>
              <Field label="Primary trade / service">
                <select className={inputStyles} value={form.primaryTrade} onChange={(e) => set({ primaryTrade: e.target.value })}>
                  <option value="">Choose a trade…</option>
                  {(services ?? []).map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </Field>
              <Field label="Additional services" hint="Optional, comma separated">
                <input className={inputStyles} value={form.additionalServices} onChange={(e) => set({ additionalServices: e.target.value })} />
              </Field>
              <Field label="City">
                <input className={inputStyles} value={form.city} onChange={(e) => set({ city: e.target.value })} autoComplete="address-level2" />
              </Field>
              <Field label="State">
                <input className={inputStyles} maxLength={2} value={form.stateCode} onChange={(e) => set({ stateCode: e.target.value.toUpperCase() })} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Service area" hint="Cities or ZIP codes you serve">
                  <input className={inputStyles} value={form.serviceArea} onChange={(e) => set({ serviceArea: e.target.value })} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="License / certification info" hint="Optional — license numbers or certifications relevant to your trade">
                  <textarea className={`${inputStyles} h-20 py-3`} value={form.licenseInfo} onChange={(e) => set({ licenseInfo: e.target.value })} />
                </Field>
              </div>
              {user ? null : (
                <div className="sm:col-span-2">
                  <Field label="Create a password" hint="At least 8 characters — this becomes your AirGround account">
                    <input className={inputStyles} type="password" value={form.password} onChange={(e) => set({ password: e.target.value })} autoComplete="new-password" />
                  </Field>
                </div>
              )}
            </div>
            <Button type="submit" size="lg" disabled={busy}>
              {busy ? "Submitting…" : "Submit application"}
            </Button>
          </form>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
