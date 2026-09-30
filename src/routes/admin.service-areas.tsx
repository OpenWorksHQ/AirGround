import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button, inputStyles } from "@/components/ag";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAreas } from "@/lib/admin";

export const Route = createFileRoute("/admin/service-areas")({
  component: AdminAreas,
});

function AdminAreas() {
  const queryClient = useQueryClient();
  const { data: areas } = useAdminAreas();
  const [zipDraft, setZipDraft] = useState<Record<string, string>>({});
  const [newState, setNewState] = useState("");
  const [newName, setNewName] = useState("");

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-areas"] });
    queryClient.invalidateQueries({ queryKey: ["service-areas"] });
  };

  const update = async (id: string, patch: Record<string, unknown>) => {
    const { error } = await supabase
      .from("service_areas")
      .update(patch as never)
      .eq("id", id);
    if (error) {
      toast.error("Couldn't save that change.");
      return;
    }
    toast.success("Coverage updated.");
    refresh();
  };

  const addZip = async (id: string, current: string[]) => {
    const zip = (zipDraft[id] ?? "").trim();
    if (!/^\d{5}$/.test(zip)) {
      toast.error("Enter a 5-digit ZIP code.");
      return;
    }
    if (current.includes(zip)) {
      toast.error("That ZIP is already covered.");
      return;
    }
    await update(id, { zip_codes: [...current, zip].sort() });
    setZipDraft((d) => ({ ...d, [id]: "" }));
  };

  const addArea = async () => {
    const code = newState.trim().toUpperCase();
    if (code.length !== 2 || !newName.trim()) {
      toast.error("Enter a state name and its 2-letter code.");
      return;
    }
    const { error } = await supabase.from("service_areas").insert({
      state_code: code,
      name: newName.trim(),
      zip_codes: [],
      cities: [],
      active: false,
    });
    if (error) {
      toast.error("Couldn't add that area.");
      return;
    }
    toast.success(`${newName.trim()} added. Turn it on when you're ready to take work there.`);
    setNewState("");
    setNewName("");
    refresh();
  };

  return (
    <div>
      <h1 className="display-xl text-[2.2rem]">Service areas</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Only active areas appear to customers. ZIP codes decide who can book right away.
      </p>

      <div className="mt-6 space-y-4">
        {(areas ?? []).map((area) => (
          <section key={area.id} className="rounded-2xl border border-border bg-card p-6">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0">
                <h2 className="text-lg font-extrabold">
                  {area.name} <span className="text-muted-foreground">({area.state_code})</span>
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {area.zip_codes.length} ZIP code(s) covered
                </p>
              </div>
              <Button
                variant={area.active ? "primary" : "outline"}
                size="sm"
                onClick={() => update(area.id, { active: !area.active })}
              >
                {area.active ? "Taking work" : "Not launched"}
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {area.zip_codes.map((zip) => (
                <button
                  key={zip}
                  onClick={() =>
                    update(area.id, { zip_codes: area.zip_codes.filter((z) => z !== zip) })
                  }
                  className="rounded-full border border-border-strong px-3 py-1 text-xs font-semibold hover:bg-secondary"
                  title="Remove this ZIP code"
                >
                  {zip} ×
                </button>
              ))}
              {area.zip_codes.length === 0 ? (
                <p className="text-xs text-muted-foreground">No ZIP codes yet.</p>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <input
                aria-label={`Add ZIP code to ${area.name}`}
                className={`${inputStyles} h-10 max-w-[160px]`}
                placeholder="49503"
                inputMode="numeric"
                value={zipDraft[area.id] ?? ""}
                onChange={(e) => setZipDraft((d) => ({ ...d, [area.id]: e.target.value }))}
              />
              <Button size="sm" onClick={() => addZip(area.id, area.zip_codes)}>
                Add ZIP
              </Button>
            </div>
          </section>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-paper p-6">
        <span className="eyebrow">Add a new state</span>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            aria-label="State name"
            className={`${inputStyles} h-10 max-w-[220px]`}
            placeholder="Ohio"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            aria-label="State code"
            className={`${inputStyles} h-10 max-w-[100px]`}
            placeholder="OH"
            maxLength={2}
            value={newState}
            onChange={(e) => setNewState(e.target.value)}
          />
          <Button size="sm" onClick={addArea}>
            Add area
          </Button>
        </div>
      </section>
    </div>
  );
}
