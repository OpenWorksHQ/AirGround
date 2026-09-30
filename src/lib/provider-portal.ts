import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Provider, ProviderOffering } from "@/lib/providers";

/** Everything a provider team member may see, scoped by RLS to their own provider(s). */
export function useProviderPortal() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["provider-portal", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: members, error } = await supabase
        .from("provider_members")
        .select("provider_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      const ids = (members ?? []).map((m) => m.provider_id);
      if (ids.length === 0) {
        return { providers: [], jobs: [], plans: [], items: [], customers: [], properties: [], offerings: [] };
      }
      const [providers, jobs, plans, offerings] = await Promise.all([
        supabase.from("providers").select("*").in("id", ids),
        supabase.from("service_requests").select("*").in("provider_id", ids).order("requested_date", { ascending: true }),
        supabase.from("care_plans").select("*").in("provider_id", ids),
        supabase.from("provider_services").select("*, service:services(*)").in("provider_id", ids).order("sort_order"),
      ]);
      for (const r of [providers, jobs, plans, offerings]) if (r.error) throw r.error;
      const planIds = (plans.data ?? []).map((p) => p.id);
      const userIds = [...new Set([...(jobs.data ?? []).map((j) => j.user_id), ...(plans.data ?? []).map((p) => p.user_id)])];
      const propIds = [
        ...new Set(
          [...(jobs.data ?? []).map((j) => j.property_id), ...(plans.data ?? []).map((p) => p.property_id)].filter(
            (x): x is string => !!x,
          ),
        ),
      ];
      const [items, customers, properties] = await Promise.all([
        planIds.length ? supabase.from("care_plan_items").select("*").in("care_plan_id", planIds) : { data: [], error: null },
        userIds.length ? supabase.from("profiles").select("id, full_name, email, phone").in("id", userIds) : { data: [], error: null },
        propIds.length ? supabase.from("properties").select("*").in("id", propIds) : { data: [], error: null },
      ]);
      return {
        providers: (providers.data ?? []) as Provider[],
        jobs: jobs.data ?? [],
        plans: plans.data ?? [],
        items: items.data ?? [],
        customers: customers.data ?? [],
        properties: properties.data ?? [],
        offerings: (offerings.data ?? []) as unknown as ProviderOffering[],
      };
    },
  });
}

export type PortalData = NonNullable<ReturnType<typeof useProviderPortal>["data"]>;
export type PortalJob = PortalData["jobs"][number];

export const money = (n: number | null | undefined) =>
  n == null ? "—" : `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export const todayIso = () => new Date().toISOString().slice(0, 10);
