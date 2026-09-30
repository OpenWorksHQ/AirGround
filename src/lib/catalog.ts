import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string;
  slug: string;
  name: string;
  blurb: string;
  icon: string;
  sort_order: number;
  active: boolean;
};

export type Service = {
  id: string;
  slug: string;
  name: string;
  category_slug: string;
  summary: string;
  included: string[];
  recurring_allowed: boolean;
  default_frequency: string | null;
  price_from: number | null;
  sort_order: number;
  active: boolean;
};

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });
}

export function useServices(categorySlug?: string) {
  return useQuery({
    queryKey: ["services", categorySlug ?? "all"],
    queryFn: async () => {
      let q = supabase.from("services").select("*").eq("active", true).order("sort_order");
      if (categorySlug) q = q.eq("category_slug", categorySlug);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Service[];
    },
  });
}

export function useService(slug: string) {
  return useQuery({
    queryKey: ["service", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Service | null;
    },
  });
}
