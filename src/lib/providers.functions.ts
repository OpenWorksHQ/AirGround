import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const applicationInput = z.object({
  userId: z.string().uuid().nullish(),
  fullName: z.string().trim().min(2).max(120),
  businessName: z.string().trim().max(120).nullish(),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(7).max(30),
  primaryTrade: z.string().trim().min(2).max(120),
  additionalServices: z.string().trim().max(500).nullish(),
  city: z.string().trim().min(2).max(120),
  stateCode: z.string().trim().length(2),
  serviceArea: z.string().trim().min(2).max(300),
  licenseInfo: z.string().trim().max(500).nullish(),
});

/**
 * Public endpoint for the "Are you a tradesperson?" application form. The
 * account itself is created client-side via Supabase Auth (email + password);
 * this stores the application in a Pending Review state for admins.
 */
export const submitProviderApplication = createServerFn({ method: "POST" })
  .inputValidator((data) => applicationInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("provider_applications").insert({
      user_id: data.userId ?? null,
      full_name: data.fullName,
      business_name: data.businessName || null,
      email: data.email.toLowerCase(),
      phone: data.phone,
      primary_trade: data.primaryTrade,
      additional_services: data.additionalServices || null,
      city: data.city,
      state_code: data.stateCode.toUpperCase(),
      service_area: data.serviceArea,
      license_info: data.licenseInfo || null,
    });
    if (error) throw error;
    return { ok: true };
  });
