import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const AnalyzeInput = z.object({
  imageBase64: z.string().min(20),
  mimeType: z.string().default("image/jpeg"),
  userNote: z.string().optional(),
});

const CATEGORIES = [
  "pothole", "garbage", "streetlight", "water_leak", "sewage", "road_damage",
  "illegal_dumping", "graffiti", "broken_sign", "flooding", "tree_hazard", "other",
] as const;
const DEPARTMENTS = [
  "public_works", "sanitation", "electricity", "water", "transportation",
  "parks_recreation", "public_safety", "general",
] as const;
const SEVERITIES = ["low", "medium", "high", "critical"] as const;

const SYSTEM_PROMPT = `You are SwasthCity, an assistant that analyzes photos of public-infrastructure problems reported by citizens.

For each image, return STRICT JSON with these fields:
- title: short human title (max 60 chars)
- description: 1-2 sentence factual description of the visible issue
- category: one of ${CATEGORIES.join(", ")}
- severity: one of ${SEVERITIES.join(", ")} (critical = immediate danger to life/property)
- department: one of ${DEPARTMENTS.join(", ")} that should handle it
- confidence: number 0-1
- reasoning: 1 short sentence justifying severity + department

If the image is not a civic infrastructure issue, still return valid JSON with category="other", severity="low", department="general", and a description explaining that.`;

export const analyzeReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AnalyzeInput.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const userText = data.userNote?.trim()
      ? `Citizen note: ${data.userNote}\nAnalyze the image and return JSON only.`
      : "Analyze this image and return JSON only.";

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: userText },
              { type: "image_url", image_url: { url: `data:${data.mimeType};base64,${data.imageBase64}` } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("AI rate limit reached. Please try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please add credits in Cloud settings.");
      throw new Error(`AI error (${res.status}): ${body.slice(0, 200)}`);
    }

    const json = await res.json();
    const raw = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }

    const pick = <T extends readonly string[]>(v: unknown, list: T, fallback: T[number]): T[number] =>
      (typeof v === "string" && (list as readonly string[]).includes(v) ? v : fallback) as T[number];

    return {
      title: String(parsed.title ?? "Reported civic issue").slice(0, 80),
      description: String(parsed.description ?? ""),
      category: pick(parsed.category, CATEGORIES, "other"),
      severity: pick(parsed.severity, SEVERITIES, "medium"),
      department: pick(parsed.department, DEPARTMENTS, "general"),
      confidence: typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0.6,
      reasoning: String(parsed.reasoning ?? ""),
    };
  });
