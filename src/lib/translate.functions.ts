import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { LANGUAGE_MAP, isLanguageCode } from "@/lib/languages";

const Input = z.object({
  language: z.string(),
  texts: z.array(z.string().min(1)).min(1).max(80),
});

/**
 * Batch-translate an array of English UI strings into the requested language.
 * Returns an object keyed by the ORIGINAL English string.
 * Public endpoint — safe: it only translates arbitrary text via the AI gateway.
 */
export const translateBatch = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const lang = data.language;
    if (!isLanguageCode(lang) || lang === "en") {
      const out: Record<string, string> = {};
      for (const t of data.texts) out[t] = t;
      return { translations: out };
    }

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const def = LANGUAGE_MAP[lang];
    const numbered = data.texts.map((t, i) => `${i + 1}. ${t.replace(/\n/g, " ")}`).join("\n");

    const system = `You are a professional UI translator for an Indian civic-issue reporting app called SwasthCity.
Translate each numbered English UI string into ${def.aiName}.
Rules:
- Keep translations short and natural for a mobile app UI.
- Preserve proper nouns like "SwasthCity" as-is.
- Do NOT translate placeholders written in {curly_braces}.
- Return ONLY strict JSON: {"items":[{"i":1,"t":"..."},{"i":2,"t":"..."}]} with one entry per input, in order.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: numbered },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("Translation rate limit reached. Please try again shortly.");
      if (res.status === 402) throw new Error("Translation credits exhausted.");
      throw new Error(`Translation error (${res.status}): ${body.slice(0, 200)}`);
    }

    const json = await res.json();
    const raw = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { items?: Array<{ i?: number; t?: string }> } = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }

    const out: Record<string, string> = {};
    const items = Array.isArray(parsed.items) ? parsed.items : [];
    for (let i = 0; i < data.texts.length; i++) {
      const original = data.texts[i];
      const found = items.find((x) => Number(x?.i) === i + 1);
      const translated = typeof found?.t === "string" && found.t.trim() ? found.t.trim() : original;
      out[original] = translated;
    }
    return { translations: out };
  });
