import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button, inputStyles } from "@/components/ag";
import { supabase } from "@/integrations/supabase/client";
import { useAdminServices } from "@/lib/admin";

export const Route = createFileRoute("/admin/services")({
  component: AdminServices,
});

function AdminServices() {
  const queryClient = useQueryClient();
  const { data: services } = useAdminServices();

  const update = async (id: string, patch: Record<string, unknown>) => {
    const { error } = await supabase.from("services").update(patch).eq("id", id);
    if (error) {
      toast.error("Couldn't save that change.");
      return;
    }
    toast.success("Service updated.");
    queryClient.invalidateQueries({ queryKey: ["admin-services"] });
    queryClient.invalidateQueries({ queryKey: ["services"] });
  };

  const groups = new Map<string, NonNullable<typeof services>>();
  for (const s of services ?? []) {
    groups.set(s.category_slug, [...(groups.get(s.category_slug) ?? []), s]);
  }

  return (
    <div>
      <h1 className="display-xl text-[2.2rem]">Services &amp; pricing</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Turn a service off to hide it from customers. Starting price shows as "from" pricing.
      </p>

      <div className="mt-6 space-y-4">
        {[...groups.entries()].map(([category, rows]) => (
          <section key={category} className="rounded-2xl border border-border bg-card">
            <header className="border-b border-border px-6 py-4">
              <h2 className="text-sm font-bold capitalize">{category.replace(/-/g, " ")}</h2>
            </header>
            <div className="divide-y divide-border">
              {rows.map((s) => (
                <div
                  key={s.id}
                  className="grid gap-3 px-6 py-4 lg:grid-cols-[minmax(0,1fr)_140px_auto_auto] lg:items-center"
                >
                  <p className="min-w-0 truncate text-sm font-bold">{s.name}</p>
                  <label className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">From $</span>
                    <input
                      aria-label={`Starting price for ${s.name}`}
                      className={`${inputStyles} h-10`}
                      type="number"
                      min={0}
                      defaultValue={s.price_from ?? ""}
                      onBlur={(e) => {
                        const value = e.target.value === "" ? null : Number(e.target.value);
                        if (value !== s.price_from) update(s.id, { price_from: value });
                      }}
                    />
                  </label>
                  <Button
                    variant={s.recurring_allowed ? "soft" : "outline"}
                    size="sm"
                    onClick={() => update(s.id, { recurring_allowed: !s.recurring_allowed })}
                  >
                    {s.recurring_allowed ? "Ongoing care on" : "Ongoing care off"}
                  </Button>
                  <Button
                    variant={s.active ? "primary" : "outline"}
                    size="sm"
                    onClick={() => update(s.id, { active: !s.active })}
                  >
                    {s.active ? "Live" : "Hidden"}
                  </Button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
