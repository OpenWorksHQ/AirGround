import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { PropertyRow, RequestRow } from "@/lib/account";

export type AdminRequest = RequestRow & { user_id: string; category_slug: string | null };

export function useAdminRequests() {
  return useQuery({
    queryKey: ["admin-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AdminRequest[];
    },
  });
}

export function useAdminCustomers() {
  return useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,email,phone,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as {
        id: string;
        full_name: string | null;
        email: string | null;
        phone: string | null;
        created_at: string;
      }[];
    },
  });
}

export function useAdminProperties() {
  return useQuery({
    queryKey: ["admin-properties"],
    queryFn: async () => {
      const { data, error } = await supabase.from("properties").select("*").order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as (PropertyRow & { user_id: string })[];
    },
  });
}

export function useAdminPlanItems() {
  return useQuery({
    queryKey: ["admin-plan-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("care_plan_items")
        .select("id,care_plan_id,service_name,frequency,paused,next_service_date")
        .order("next_service_date");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAdminAreas() {
  return useQuery({
    queryKey: ["admin-areas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("service_areas").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as {
        id: string;
        state_code: string;
        name: string;
        zip_codes: string[];
        cities: string[];
        active: boolean;
      }[];
    },
  });
}

export function useAdminServices() {
  return useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").order("category_slug");
      if (error) throw error;
      return (data ?? []) as {
        id: string;
        slug: string;
        name: string;
        category_slug: string;
        price_from: number | null;
        recurring_allowed: boolean;
        active: boolean;
      }[];
    },
  });
}

export const STATUS_FLOW = [
  "requested",
  "confirmed",
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
] as const;
