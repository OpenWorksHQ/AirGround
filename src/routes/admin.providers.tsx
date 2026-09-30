import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button, Field, inputStyles } from "@/components/ag";
import { ProviderShare } from "@/components/provider-share";
import { supabase } from "@/integrations/supabase/client";
import { FREQUENCIES, TIME_WINDOWS } from "@/lib/booking";
import type { Service } from "@/lib/catalog";
import { slugify, WEEKDAYS, type Provider } from "@/lib/providers";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/providers")({
  component: AdminProviders,
});

type Offering = {
  id: string;
  service_id: string;
  price: number | null;
  price_note: string | null;
  enabled: boolean;
  recurring_enabled: boolean;
  allowed_frequencies: string[];
};

function useAllProviders() {
  return useQuery({
    queryKey: ["admin-providers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("providers").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as Provider[];
    },
  });
}

function useCatalog() {
  return useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Service[];
    },
  });
}

function useBookingCounts() {
  return useQuery({
    queryKey: ["admin-provider-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("provider_id")
        .not("provider_id", "is", null);
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const r of data ?? []) counts[r.provider_id!] = (counts[r.provider_id!] ?? 0) + 1;
      return counts;
    },
  });
}

function AdminProviders() {
  const queryClient = useQueryClient();
  const { data: providers } = useAllProviders();
  const { data: counts } = useBookingCounts();
  const [openId, setOpenId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const create = async () => {
    const name = newName.trim();
    if (!name) return;
    const { data, error } = await supabase
      .from("providers")
      .insert({ name, slug: slugify(name) || `provider-${Date.now()}` })
      .select("id")
      .single();
    if (error) {
      toast.error(error.code === "23505" ? "That page link is already taken." : "Couldn't create provider.");
      return;
    }
    setNewName("");
    setOpenId(data.id);
    queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
    toast.success("Provider created.");
  };

  return (
    <div>
      <h1 className="display-xl text-[2.2rem]">Providers</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Each provider gets a booking page at /p/their-link showing only the services and prices set here.
      </p>

      <div className="mt-6 flex gap-2">
        <input
          className={`${inputStyles} max-w-sm`}
          placeholder="New provider name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
        />
        <Button onClick={create} size="lg">
          Add provider
        </Button>
      </div>

      <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
        {(providers ?? []).map((p) => (
          <div key={p.id} className="px-6 py-4">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <button className="min-w-0 text-left" onClick={() => setOpenId(openId === p.id ? null : p.id)}>
                <p className="truncate text-sm font-bold">
                  {p.name} {p.active ? "" : "· inactive"}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  /p/{p.slug} · {counts?.[p.id] ?? 0} bookings
                </p>
              </button>
              <div className="flex gap-2">
                <a
                  href={`/p/${p.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center rounded-lg border border-border-strong px-3.5 text-[0.8rem] font-semibold hover:bg-secondary"
                >
                  Open page
                </a>
                <Button variant="soft" size="sm" onClick={() => setOpenId(openId === p.id ? null : p.id)}>
                  {openId === p.id ? "Close" : "Edit"}
                </Button>
              </div>
            </div>
            {openId === p.id ? <ProviderEditor provider={p} /> : null}
          </div>
        ))}
        {(providers ?? []).length === 0 ? (
          <p className="px-6 py-5 text-sm text-muted-foreground">No providers yet.</p>
        ) : null}
      </div>
    </div>
  );
}

function ProviderEditor({ provider }: { provider: Provider }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    ...provider,
    zipText: provider.zip_codes.join(", "),
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    const slug = slugify(form.slug);
    if (!slug || !form.name.trim()) {
      toast.error("Name and page link are required.");
      return;
    }
    const { error } = await supabase
      .from("providers")
      .update({
        name: form.name.trim(),
        slug,
        description: form.description,
        image_url: form.image_url || null,
        contact_email: form.contact_email || null,
        contact_phone: form.contact_phone || null,
        service_area: form.service_area,
        zip_codes: form.zipText.split(/[\s,]+/).filter((z) => /^\d{5}$/.test(z)),
        available_days: form.available_days,
        time_windows: form.time_windows,
        lead_days: Number(form.lead_days) || 0,
        active: form.active,
      })
      .eq("id", provider.id);
    if (error) {
      toast.error(error.code === "23505" ? "That page link is already taken." : "Couldn't save provider.");
      return;
    }
    toast.success("Provider saved.");
    queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
    queryClient.invalidateQueries({ queryKey: ["provider"] });
  };

  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <div className="mt-4 space-y-6 rounded-xl bg-paper p-5">
      <div>
        <span className="eyebrow">Share</span>
        <div className="mt-2">
          <ProviderShare slug={provider.slug} name={provider.name} />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Name">
          <input className={inputStyles} value={form.name} onChange={(e) => set({ name: e.target.value })} />
        </Field>
        <Field label="Page link" hint={`airground.co/p/${slugify(form.slug)}`}>
          <input className={inputStyles} value={form.slug} onChange={(e) => set({ slug: e.target.value })} />
        </Field>
        <div className="lg:col-span-2">
          <Field label="Short description">
            <textarea
              className={`${inputStyles} h-20 py-3`}
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Photo or logo URL" hint="Optional — a link to an image">
          <input className={inputStyles} value={form.image_url ?? ""} onChange={(e) => set({ image_url: e.target.value })} />
        </Field>
        <Field label="Service area" hint="Shown on the page, e.g. Ann Arbor & Ypsilanti">
          <input className={inputStyles} value={form.service_area} onChange={(e) => set({ service_area: e.target.value })} />
        </Field>
        <Field label="Contact email">
          <input className={inputStyles} value={form.contact_email ?? ""} onChange={(e) => set({ contact_email: e.target.value })} />
        </Field>
        <Field label="Contact phone">
          <input className={inputStyles} value={form.contact_phone ?? ""} onChange={(e) => set({ contact_phone: e.target.value })} />
        </Field>
        <Field label="ZIP codes served" hint="Comma separated. Leave empty to use AirGround coverage.">
          <input className={inputStyles} value={form.zipText} onChange={(e) => set({ zipText: e.target.value })} />
        </Field>
        <Field label="Notice needed (days)">
          <input
            type="number"
            min={0}
            className={inputStyles}
            value={form.lead_days}
            onChange={(e) => set({ lead_days: Number(e.target.value) })}
          />
        </Field>
      </div>

      <div>
        <span className="eyebrow">Available days</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {WEEKDAYS.map((d) => (
            <Chip key={d.value} on={form.available_days.includes(d.value)} onClick={() => set({ available_days: toggle(form.available_days, d.value) })}>
              {d.label}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <span className="eyebrow">Arrival windows</span>
        <p className="mt-1 text-xs text-muted-foreground">None selected uses the standard AirGround windows.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TIME_WINDOWS.map((w) => (
            <Chip key={w} on={form.time_windows.includes(w)} onClick={() => set({ time_windows: toggle(form.time_windows, w) })}>
              {w}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={save}>Save provider</Button>
        <Button variant={form.active ? "soft" : "outline"} onClick={() => set({ active: !form.active })}>
          {form.active ? "Active — click to deactivate" : "Inactive — click to activate"}
        </Button>
      </div>

      <ProviderServices providerId={provider.id} />
      <ProviderTeam providerId={provider.id} />
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold",
        on ? "border-primary bg-secondary text-primary" : "border-border text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

function ProviderServices({ providerId }: { providerId: string }) {
  const queryClient = useQueryClient();
  const { data: catalog } = useCatalog();
  const { data: offerings } = useQuery({
    queryKey: ["admin-provider-services", providerId],
    queryFn: async () => {
      const { data, error } = await supabase.from("provider_services").select("*").eq("provider_id", providerId);
      if (error) throw error;
      return (data ?? []) as Offering[];
    },
  });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-provider-services", providerId] });
    queryClient.invalidateQueries({ queryKey: ["provider"] });
  };

  const assign = async (s: Service) => {
    const { error } = await supabase.from("provider_services").insert({
      provider_id: providerId,
      service_id: s.id,
      price: s.price_from,
      recurring_enabled: s.recurring_allowed,
      allowed_frequencies: [(s.default_frequency ?? "monthly") as never],
    });
    if (error) toast.error("Couldn't add service.");
    refresh();
  };
  const patch = async (id: string, p: Record<string, unknown>) => {
    const { error } = await supabase.from("provider_services").update(p as never).eq("id", id);
    if (error) toast.error("Couldn't save that change.");
    refresh();
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("provider_services").delete().eq("id", id);
    if (error) toast.error("Couldn't remove service.");
    refresh();
  };

  const unassigned = (catalog ?? []).filter((s) => !(offerings ?? []).some((o) => o.service_id === s.id));

  return (
    <div>
      <span className="eyebrow">Services offered</span>
      <div className="mt-2 divide-y divide-border rounded-xl border border-border bg-card">
        {(offerings ?? []).map((o) => {
          const s = catalog?.find((x) => x.id === o.service_id);
          return (
            <div key={o.id} className="space-y-3 px-4 py-3">
              <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_130px_150px_auto_auto_auto] lg:items-center">
                <p className="truncate text-sm font-bold">{s?.name ?? "Service"}</p>
                <label className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">$</span>
                  <input
                    aria-label="Price"
                    type="number"
                    min={0}
                    className={`${inputStyles} h-10`}
                    defaultValue={o.price ?? ""}
                    onBlur={(e) => {
                      const v = e.target.value === "" ? null : Number(e.target.value);
                      if (v !== o.price) patch(o.id, { price: v });
                    }}
                  />
                </label>
                <input
                  aria-label="Price note"
                  className={`${inputStyles} h-10`}
                  placeholder="e.g. per visit"
                  defaultValue={o.price_note ?? ""}
                  onBlur={(e) => e.target.value !== (o.price_note ?? "") && patch(o.id, { price_note: e.target.value || null })}
                />
                <Button
                  size="sm"
                  variant={o.recurring_enabled ? "soft" : "outline"}
                  onClick={() => patch(o.id, { recurring_enabled: !o.recurring_enabled })}
                >
                  {o.recurring_enabled ? "Recurring on" : "Recurring off"}
                </Button>
                <Button size="sm" variant={o.enabled ? "primary" : "outline"} onClick={() => patch(o.id, { enabled: !o.enabled })}>
                  {o.enabled ? "Live" : "Hidden"}
                </Button>
                <Button size="sm" variant="quiet" onClick={() => remove(o.id)}>
                  Remove
                </Button>
              </div>
              {o.recurring_enabled ? (
                <div className="flex flex-wrap gap-1.5">
                  {FREQUENCIES.filter((f) => f.value !== "custom").map((f) => (
                    <Chip
                      key={f.value}
                      on={o.allowed_frequencies.includes(f.value)}
                      onClick={() =>
                        patch(o.id, {
                          allowed_frequencies: o.allowed_frequencies.includes(f.value)
                            ? o.allowed_frequencies.filter((x) => x !== f.value)
                            : [...o.allowed_frequencies, f.value],
                        })
                      }
                    >
                      {f.label}
                    </Chip>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
        {(offerings ?? []).length === 0 ? (
          <p className="px-4 py-3 text-sm text-muted-foreground">No services assigned yet.</p>
        ) : null}
      </div>
      {unassigned.length > 0 ? (
        <select
          aria-label="Add a service"
          className={`${inputStyles} mt-3 max-w-sm`}
          value=""
          onChange={(e) => {
            const s = unassigned.find((x) => x.id === e.target.value);
            if (s) assign(s);
          }}
        >
          <option value="">+ Add a service from the catalog</option>
          {unassigned.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      ) : null}
      <p className="mt-3 text-xs text-muted-foreground">
        Catalog names and descriptions are managed in <Link to="/admin/services" className="font-semibold underline">Services &amp; Pricing</Link>.
      </p>
    </div>
  );
}

function ProviderTeam({ providerId }: { providerId: string }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const { data: members } = useQuery({
    queryKey: ["admin-provider-members", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_members")
        .select("id, user_id")
        .eq("provider_id", providerId);
      if (error) throw error;
      const ids = (data ?? []).map((m) => m.user_id);
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("id, full_name, email").in("id", ids)
        : { data: [] };
      return (data ?? []).map((m) => ({ ...m, profile: (profiles ?? []).find((p) => p.id === m.user_id) }));
    },
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-provider-members", providerId] });

  const add = async () => {
    const value = email.trim().toLowerCase();
    if (!value) return;
    const { data: profile } = await supabase.from("profiles").select("id").ilike("email", value).maybeSingle();
    if (!profile) {
      toast.error("No AirGround account uses that email yet — ask them to create one first.");
      return;
    }
    const { error } = await supabase.from("provider_members").insert({ provider_id: providerId, user_id: profile.id });
    if (error) {
      toast.error(error.code === "23505" ? "Already on this team." : "Couldn't add team member.");
      return;
    }
    setEmail("");
    refresh();
    toast.success("Team member added.");
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("provider_members").delete().eq("id", id);
    if (error) toast.error("Couldn't remove team member.");
    refresh();
  };

  return (
    <div>
      <span className="eyebrow">Provider team</span>
      <p className="mt-1 text-xs text-muted-foreground">
        People added here see "My Provider Page" when they sign in. They can't change anything.
      </p>
      <div className="mt-2 divide-y divide-border rounded-xl border border-border bg-card">
        {(members ?? []).map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <p className="truncate text-sm">
              {m.profile?.full_name ?? "Account"} <span className="text-muted-foreground">{m.profile?.email}</span>
            </p>
            <Button size="sm" variant="quiet" onClick={() => remove(m.id)}>
              Remove
            </Button>
          </div>
        ))}
        {(members ?? []).length === 0 ? (
          <p className="px-4 py-3 text-sm text-muted-foreground">No team members yet.</p>
        ) : null}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          className={`${inputStyles} max-w-sm`}
          type="email"
          placeholder="Their account email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <Button onClick={add}>Add</Button>
      </div>
    </div>
  );
}
