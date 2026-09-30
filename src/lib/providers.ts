import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Service } from "@/lib/catalog";

export type Provider = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  service_area: string;
  zip_codes: string[];
  available_days: string[];
  time_windows: string[];
  lead_days: number;
  active: boolean;
};

export type ProviderOffering = {
  id: string;
  provider_id: string;
  service_id: string;
  price: number | null;
  price_note: string | null;
  enabled: boolean;
  recurring_enabled: boolean;
  allowed_frequencies: string[];
  sort_order: number;
  service: Service;
};

export const WEEKDAYS = [
  { value: "sun", label: "Sun" },
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
];

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

export const formatPrice = (o: Pick<ProviderOffering, "price" | "price_note">) =>
  o.price != null ? `$${Number(o.price).toLocaleString()}${o.price_note ? ` ${o.price_note}` : ""}` : (o.price_note ?? "Quoted after review");

/** Public: an active provider and only the services it has enabled. */
export function useProvider(slug: string | undefined) {
  return useQuery({
    queryKey: ["provider", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data: provider, error } = await supabase
        .from("providers")
        .select("*")
        .eq("slug", slug!)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      if (!provider) return null;
      const { data: rows, error: e2 } = await supabase
        .from("provider_services")
        .select("*, service:services(*)")
        .eq("provider_id", provider.id)
        .eq("enabled", true)
        .order("sort_order");
      if (e2) throw e2;
      const offerings = ((rows ?? []) as unknown as ProviderOffering[]).filter(
        (o) => o.service && o.service.active,
      );
      return { provider: provider as Provider, offerings };
    },
  });
}

/** Earliest bookable date and whether a date falls on an available day. */
export function providerDateRules(p: Provider | null | undefined) {
  const min = new Date();
  min.setDate(min.getDate() + (p?.lead_days ?? 0));
  const days = p?.available_days ?? [];
  const isAllowed = (iso: string) => {
    if (!p || days.length === 0 || !iso) return true;
    const d = new Date(`${iso}T12:00:00`);
    return days.includes(WEEKDAYS[d.getDay()]!.value);
  };
  return { minDate: min.toISOString().slice(0, 10), isAllowed };
}
