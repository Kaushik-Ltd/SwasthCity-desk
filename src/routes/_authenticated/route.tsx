import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { LanguageProvider } from "@/lib/i18n";
import { isLanguageCode, type LanguageCode } from "@/lib/languages";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    // First-run onboarding gate.
    const { data: prof } = await supabase
      .from("profiles")
      .select("preferred_language, onboarded_at")
      .eq("id", data.user.id)
      .maybeSingle();

    const needsOnboarding = !prof?.onboarded_at;
    const onWelcome = location.pathname.startsWith("/welcome");
    if (needsOnboarding && !onWelcome) {
      throw redirect({ to: "/welcome" });
    }

    return {
      user: data.user,
      initialLanguage: (isLanguageCode(prof?.preferred_language) ? prof?.preferred_language : "en") as LanguageCode,
    };
  },
  component: Layout,
});

function Layout() {
  const { initialLanguage } = Route.useRouteContext();
  // Hydrate the provider once we know the user's saved language.
  const [lang] = useState<LanguageCode>(initialLanguage);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("cw:lang", lang);
    }
  }, [lang]);

  return (
    <LanguageProvider initialLanguage={lang}>
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <Outlet />
        </main>
      </div>
    </LanguageProvider>
  );
}
