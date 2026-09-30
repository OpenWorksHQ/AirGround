import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button, Field, inputStyles } from "@/components/ag";
import { Section } from "@/components/provider-portal-ui";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useProviderPortal } from "@/lib/provider-portal";

export const Route = createFileRoute("/_authenticated/provider/account")({
  component: ProviderAccount,
});

function ProviderAccount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: portal } = useProviderPortal();
  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  useEffect(() => {
    setName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
  }, [profile]);

  const save = async () => {
    const { error } = await supabase.from("profiles").update({ full_name: name, phone }).eq("id", user!.id);
    if (error) {
      toast.error("Couldn't save.");
      return;
    }
    toast.success("Saved.");
    queryClient.invalidateQueries({ queryKey: ["my-profile"] });
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="display-xl text-[2.2rem]">Account</h1>
      <Section title="Your details">
        <div className="space-y-4 p-6">
          <Field label="Email">
            <input className={inputStyles} value={user?.email ?? ""} disabled />
          </Field>
          <Field label="Name">
            <input className={inputStyles} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Phone">
            <input className={inputStyles} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Button onClick={save}>Save</Button>
        </div>
      </Section>
      {portal?.providers.map((p) => (
        <Section key={p.id} title="Business on file">
          <div className="space-y-1 p-6 text-sm">
            <p className="font-bold">{p.name}</p>
            <p className="text-muted-foreground">{p.contact_email ?? "No contact email"}</p>
            <p className="text-muted-foreground">{p.contact_phone ?? "No contact phone"}</p>
            <p className="pt-2 text-xs text-muted-foreground">Business details are managed by AirGround.</p>
          </div>
        </Section>
      ))}
    </div>
  );
}
