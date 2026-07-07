import { Link, useRouter } from "@tanstack/react-router";
import { LogOut, Shield, LayoutDashboard, PlusCircle, ListChecks, Users, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, primaryRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { LANGUAGE_MAP } from "@/lib/languages";

export function AppHeader() {
  const router = useRouter();
  const { user, roles, loading } = useAuth();
  const role = primaryRole(roles);
  const { t, language } = useI18n();
  const langDef = LANGUAGE_MAP[language];

  async function signOut() {
    await supabase.auth.signOut();
    await router.navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-hero text-primary-foreground shadow-elev-1">
            <Shield className="h-5 w-5" />
          </span>
          SwasthCity
        </Link>

        {!loading && user ? (
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link to="/dashboard">
              {({ isActive }) => (
                <Button variant={isActive ? "secondary" : "ghost"} size="sm" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" /> <span className="hidden sm:inline">{t("Dashboard")}</span>
                </Button>
              )}
            </Link>
            <Link to="/reports">
              {({ isActive }) => (
                <Button variant={isActive ? "secondary" : "ghost"} size="sm" className="gap-2">
                  <ListChecks className="h-4 w-4" /> <span className="hidden sm:inline">{t("Reports")}</span>
                </Button>
              )}
            </Link>
            {role === "citizen" && (
              <Link to="/reports/new">
                <Button size="sm" className="gap-2 bg-gradient-accent text-accent-foreground hover:opacity-95">
                  <PlusCircle className="h-4 w-4" /> <span className="hidden sm:inline">{t("New Report")}</span>
                </Button>
              </Link>
            )}
            {role === "admin" && (
              <Link to="/admin">
                {({ isActive }) => (
                  <Button variant={isActive ? "secondary" : "ghost"} size="sm" className="gap-2">
                    <Users className="h-4 w-4" /> <span className="hidden sm:inline">{t("Admin")}</span>
                  </Button>
                )}
              </Link>
            )}
            <Link to="/settings">
              {({ isActive }) => (
                <Button variant={isActive ? "secondary" : "ghost"} size="sm" className="gap-2" title={t("Settings")}>
                  <Settings className="h-4 w-4" />
                  <span className="hidden text-xs font-medium sm:inline" lang={language}>{langDef.native}</span>
                </Button>
              )}
            </Link>
            <Badge variant="outline" className="ml-2 hidden capitalize sm:inline-flex">{t(role)}</Badge>
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">{t("Sign out")}</span>
            </Button>
          </nav>
        ) : (
          !loading && (
            <div className="flex items-center gap-2">
              <Link to="/auth"><Button variant="ghost" size="sm">{t("Sign in")}</Button></Link>
              <Link to="/auth"><Button size="sm" className="bg-gradient-accent text-accent-foreground hover:opacity-95">{t("Get started")}</Button></Link>
            </div>
          )
        )}
      </div>
    </header>
  );
}
