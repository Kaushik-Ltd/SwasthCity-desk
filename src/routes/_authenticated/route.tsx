import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { isLanguageCode, type LanguageCode } from "@/lib/languages";

type SessionInfo = {
  userId: string;
  initialLanguage: LanguageCode;
  onboarded: boolean;
};

let sessionCache: { key: string; value: SessionInfo } | null = null;

async function loadSessionInfo(): Promise<SessionInfo> {
  const { data: sessData } = await supabase.auth.getSession();
  const session = sessData.session;
  if (!session?.user) throw redirect({ to: "/auth" });

  const cacheKey = `${session.user.id}:${session.expires_at ?? ""}`;
  if (sessionCache && sessionCache.key === cacheKey) return sessionCache.value;

  const { data: prof } = await supabase
    .from("profiles")
    .select("preferred_language, onboarded_at")
    .eq("id", session.user.id)
    .maybeSingle();

  const info: SessionInfo = {
    userId: session.user.id,
    initialLanguage: (isLanguageCode(prof?.preferred_language) ? prof?.preferred_language : "en") as LanguageCode,
    onboarded: Boolean(prof?.onboarded_at),
  };
  sessionCache = { key: cacheKey, value: info };
  return info;
}

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
      sessionCache = null;
    }
  });
}

const ONBOARDING_EXEMPT = new Set<string>(["/welcome"]);

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const info = await loadSessionInfo();
    if (!info.onboarded && !ONBOARDING_EXEMPT.has(location.pathname)) {
      throw redirect({ to: "/welcome", replace: true });
    }
    return info;
  },
  component: Layout,
});

function Layout() {
  const { initialLanguage } = Route.useRouteContext();
  const { language, setLanguage } = useI18n();

  // Sync the user's saved profile language into the shared i18n context on first mount.
  useEffect(() => {
    if (initialLanguage && initialLanguage !== language) {
      void setLanguage(initialLanguage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLanguage]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}


