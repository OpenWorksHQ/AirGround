import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type RequestRow = {
  id: string;
  request_number: string;
  service_name: string;
  status: string;
  requested_date: string | null;
  time_window: string | null;
  description: string | null;
  estimate_note: string | null;
  care_plan_id: string | null;
  property_id: string | null;
  created_at: string;
};

export type PropertyRow = {
  id: string;
  address_line1: string;
  city: string | null;
  state_code: string;
  zip: string;
  lot_size: string | null;
  access_notes: string | null;
};

export type PlanItemRow = {
  id: string;
  care_plan_id: string;
  service_name: string;
  frequency: string;
  paused: boolean;
  next_service_date: string | null;
};

export type PlanRow = {
  id: string;
  status: string;
  property_id: string | null;
  care_plan_items: PlanItemRow[];
};

export function useMyRequests() {
  return useQuery({
    queryKey: ["my-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select(
          "id,request_number,service_name,status,requested_date,time_window,description,estimate_note,care_plan_id,property_id,created_at",
        )
        .order("requested_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as RequestRow[];
    },
  });
}

export function useMyProperties() {
  return useQuery({
    queryKey: ["my-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id,address_line1,city,state_code,zip,lot_size,access_notes")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as PropertyRow[];
    },
  });
}

export function useMyCarePlans() {
  return useQuery({
    queryKey: ["my-care-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("care_plans")
        .select(
          "id,status,property_id,care_plan_items(id,care_plan_id,service_name,frequency,paused,next_service_date)",
        )
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as PlanRow[];
    },
  });
}

export const isUpcoming = (r: RequestRow) =>
  !["completed", "cancelled"].includes(r.status);

export const formatDate = (value: string | null) =>
  value
    ? new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "Date to be confirmed";
