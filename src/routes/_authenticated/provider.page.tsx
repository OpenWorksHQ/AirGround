import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { ProviderShare } from "@/components/provider-share";


import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Provider } from "@/lib/providers";

export const Route = createFileRoute("/_authenticated/provider/page")({
  head: () => ({
    meta: [
      { title: "My Provider Page — AIRGROUND" },
      { name: "description", content: "View and share your AirGround provider booking page." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "My Provider Page — AIRGROUND" },
      { property: "og:description", content: "Share your AirGround booking link with your customers." },
    ],
  }),
  component: ProviderDashboard,
});

function ProviderDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my-providers", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: members, error } = await supabase
        .from("provider_members")
        .select("provider_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      const ids = (members ?? []).map((m) => m.provider_id);
      if (ids.length === 0) return [];
      const { data: providers, error: e2 } = await supabase.from("providers").select("*").in("id", ids);
      if (e2) throw e2;
      return (providers ?? []) as Provider[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      
      <main className="mx-auto max-w-[1000px] px-5 py-10 lg:px-10">
        <h1 className="display-xl text-[2.2rem]">My Provider Page</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Send this link to your customers. They'll only see your services and prices.
        </p>
        <div className="mt-6 space-y-4">
          {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
          {(data ?? []).map((p) => (
            <section key={p.id} className="rounded-2xl border border-border bg-card p-6">
              <p className="text-sm font-bold">
                {p.name}
                {p.active ? "" : " · paused by AirGround"}
              </p>
              <div className="mt-4">
                <ProviderShare slug={p.slug} name={p.name} />
              </div>
            </section>
          ))}
          {!isLoading && (data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Your account isn't linked to a provider page yet. Ask AirGround to add you.
            </p>
          ) : null}
        </div>
      </main>
      
    </div>
  );
}
