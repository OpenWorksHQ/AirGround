import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button, inputStyles } from "@/components/ag";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_FLOW, useAdminCustomers, useAdminProperties, useAdminRequests } from "@/lib/admin";
import { TIME_WINDOWS } from "@/lib/booking";

export const Route = createFileRoute("/admin/requests")({
  component: AdminRequests;
});

function AdminRequests() {
  return null;
}
