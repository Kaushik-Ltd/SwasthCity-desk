import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useServerFn } from "@tanstack/react-start";
import { translateBatch } from "@/lib/translate.functions";
import { updateMyPreferences } from "@/lib/onboarding.functions";
import { isLanguageCode, type LanguageCode } from "@/lib/languages";

type Cache = Record<string, string>; // englishText -> translated

interface I18nContextValue {
  language: LanguageCode;
  setLanguage: (code: LanguageCode, opts?: { persistToProfile?: boolean }) => Promise<void>;
  t: (english: string) => string;
  ready: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);
const STORAGE_KEY = "cw:lang";
const cacheKey = (code: string) => `cw:translations:${code}`;

function loadCache(code: string): Cache {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(cacheKey(code));
    return raw ? (JSON.parse(raw) as Cache) : {};
  } catch {
    return {};
  }
}

function saveCache(code: string, cache: Cache) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(cacheKey(code), JSON.stringify(cache));
  } catch {
    /* quota — ignore */
  }
}

export function LanguageProvider({
  children,
  initialLanguage,
}: {
  children: ReactNode;
  initialLanguage?: LanguageCode | null;
}) {
  const translateFn = useServerFn(translateBatch);
  const updatePrefsFn = useServerFn(updateMyPreferences);

  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (initialLanguage && isLanguageCode(initialLanguage)) return initialLanguage;
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isLanguageCode(stored)) return stored;
    }
    return "en";
  });

  const cacheRef = useRef<Cache>({});
  const pendingRef = useRef<Set<string>>(new Set());
  const inFlightRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, forceRender] = useState(0);
  const bump = useCallback(() => forceRender((n) => n + 1), []);

  // Reload cache whenever language changes.
  useEffect(() => {
    cacheRef.current = loadCache(language);
    pendingRef.current.clear();
    inFlightRef.current.clear();
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, language);
      document.documentElement.lang = language;
      document.documentElement.dir = language === "ur" ? "rtl" : "ltr";
    }
    bump();
  }, [language, bump]);

  const flush = useCallback(async () => {
    timerRef.current = null;
    const batch = Array.from(pendingRef.current);
    pendingRef.current.clear();
    if (!batch.length || language === "en") return;
    for (const s of batch) inFlightRef.current.add(s);
    try {
      const chunks: string[][] = [];
      for (let i = 0; i < batch.length; i += 40) chunks.push(batch.slice(i, i + 40));
      for (const chunk of chunks) {
        const res = await translateFn({ data: { language, texts: chunk } });
        const trans = res.translations ?? {};
        for (const [en, tr] of Object.entries(trans)) cacheRef.current[en] = tr;
        saveCache(language, cacheRef.current);
        bump();
      }
    } catch (e) {
      console.warn("[i18n] translation failed:", (e as Error).message);
    } finally {
      for (const s of batch) inFlightRef.current.delete(s);
    }
  }, [language, translateFn, bump]);

  const scheduleFlush = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setTimeout(flush, 120);
  }, [flush]);

  const t = useCallback(
    (english: string) => {
      if (!english) return english;
      if (language === "en") return english;
      const hit = cacheRef.current[english];
      if (hit) return hit;
      if (!inFlightRef.current.has(english) && !pendingRef.current.has(english)) {
        pendingRef.current.add(english);
        scheduleFlush();
      }
      return english; // fall back until translation resolves
    },
    [language, scheduleFlush],
  );

  const setLanguage = useCallback(
    async (code: LanguageCode, opts?: { persistToProfile?: boolean }) => {
      setLanguageState(code);
      if (opts?.persistToProfile) {
        try {
          await updatePrefsFn({ data: { preferred_language: code } });
        } catch (e) {
          console.warn("[i18n] persist language failed:", (e as Error).message);
        }
      }
    },
    [updatePrefsFn],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ language, setLanguage, t, ready: true }),
    [language, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Safe fallback: identity translator so pages don't crash if provider missing.
    return {
      language: "en",
      setLanguage: async () => {},
      t: (s: string) => s,
      ready: false,
    };
  }
  return ctx;
}

/** Inline translation component. Wrap any static English text: <T>Dashboard</T>. */
export function T({ children }: { children: string }) {
  const { t } = useI18n();
  return <>{t(children)}</>;
}
