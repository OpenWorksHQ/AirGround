import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export type HomeRoute = "/admin" | "/provider" | "/account";

/** Where a signed-in person belongs: admin → portal, provider team → provider dashboard, else account. */
export async function resolveHomeRoute(userId: string): Promise<HomeRoute> {
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (isAdmin === true) return "/admin";
  const { count } = await supabase
    .from("provider_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ? "/provider" : "/account";
}

export function useHomeRoute() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["home-route", user?.id],
    enabled: !!user,
    queryFn: () => resolveHomeRoute(user!.id),
  });
}
