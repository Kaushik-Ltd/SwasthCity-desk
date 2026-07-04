import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PrefsInput = z.object({
  preferred_language: z.string().min(2).max(8).optional(),
  region_state: z.string().max(120).nullable().optional(),
  region_district: z.string().max(120).nullable().optional(),
  region_city: z.string().max(120).nullable().optional(),
  region_municipality: z.string().max(160).nullable().optional(),
  region_pincode: z.string().max(12).nullable().optional(),
  region_lat: z.number().nullable().optional(),
  region_lng: z.number().nullable().optional(),
  mark_onboarded: z.boolean().optional(),
});

export const getMyPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("preferred_language, region_state, region_district, region_city, region_municipality, region_pincode, region_lat, region_lng, onboarded_at")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ?? null;
  });

export const updateMyPreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PrefsInput.parse(d))
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (k === "mark_onboarded") continue;
      if (v !== undefined) patch[k] = v;
    }
    if (data.mark_onboarded) patch.onboarded_at = new Date().toISOString();

    const { error } = await context.supabase
      .from("profiles")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(patch as any)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
