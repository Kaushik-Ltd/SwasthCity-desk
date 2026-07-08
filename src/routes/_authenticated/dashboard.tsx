import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, PlusCircle, ClipboardList, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, primaryRole } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STATUSES, SEVERITIES, DEPARTMENTS, labelOf, severityColor, statusColor, type Status, type Severity, type Department } from "@/lib/civic";
import { useI18n } from "@/lib/i18n";
import { CivicAuthorityCard } from "@/components/CivicAuthorityCard";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

type ReportRow = {
  id: string;
  title: string;
  status: Status;
  severity: Severity;
  department: Department;
  category: string;
  created_at: string;
  reporter_id: string;
};

function Dashboard() {
  const { user, roles, loading } = useAuth();
  const role = primaryRole(roles);
  const { t } = useI18n();

  const q = useQuery({
    queryKey: ["dashboard-reports", user?.id, role],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("id,title,status,severity,department,category,created_at,reporter_id")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as ReportRow[];
    },
  });

  if (loading) return <FullSpinner />;

  const rows = q.data ?? [];
  const total = rows.length;
  const open = rows.filter((r) => r.status !== "resolved" && r.status !== "rejected").length;
  const critical = rows.filter((r) => r.severity === "critical").length;
  const resolved = rows.filter((r) => r.status === "resolved").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">
            {role === "admin" ? t("Admin overview") : role === "authority" ? t("Department queue") : t("Your reports")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {role === "admin" && t("All reports across every department.")}
            {role === "authority" && t("Reports routed to your department.")}
            {role === "citizen" && t("Track the issues you've reported.")}
          </p>
        </div>
        {role === "citizen" && (
          <Link to="/reports/new">
            <Button className="gap-2 bg-gradient-accent text-accent-foreground hover:opacity-95">
              <PlusCircle className="h-4 w-4" /> {t("New report")}
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={ClipboardList} label={role === "citizen" ? t("Reports filed") : t("Total reports")} value={total} tone="primary" />
        <Stat icon={Clock} label={t("Open")} value={open} tone="warning" />
        <Stat icon={AlertTriangle} label={t("Critical")} value={critical} tone="destructive" />
        <Stat icon={CheckCircle2} label={t("Resolved")} value={resolved} tone="success" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t("Recent activity")}</CardTitle>
          <Link to="/reports"><Button variant="ghost" size="sm">{t("View all")}</Button></Link>
        </CardHeader>
        <CardContent>
          {q.isLoading ? (
            <div className="grid place-items-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : rows.length === 0 ? (
            <EmptyState role={role} />
          ) : (
            <div className="divide-y divide-border">
              {rows.slice(0, 8).map((r) => (
                <Link key={r.id} to="/reports/$id" params={{ id: r.id }} className="flex flex-wrap items-center justify-between gap-3 py-3 transition hover:bg-muted/40 px-2 rounded-md">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-foreground">{r.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {t(labelOf(DEPARTMENTS, r.department))} · {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={severityColor(r.severity)}>{t(labelOf(SEVERITIES, r.severity))}</Badge>
                    <Badge className={statusColor(r.status)} variant="secondary">{t(labelOf(STATUSES, r.status))}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CivicAuthorityCard />
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; tone: "primary" | "warning" | "destructive" | "success" }) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/15 text-warning-foreground",
    destructive: "bg-destructive/10 text-destructive",
    success: "bg-success/10 text-success",
  }[tone];
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <span className={`grid h-11 w-11 place-items-center rounded-lg ${toneCls}`}><Icon className="h-5 w-5" /></span>
        <div>
          <div className="text-2xl font-semibold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ role }: { role: string }) {
  const { t } = useI18n();
  return (
    <div className="grid place-items-center py-14 text-center">
      <ClipboardList className="h-8 w-8 text-muted-foreground" />
      <p className="mt-3 text-sm text-muted-foreground">
        {role === "citizen" ? t("You haven't filed any reports yet.") : t("Nothing in the queue right now.")}
      </p>
      {role === "citizen" && (
        <Link to="/reports/new" className="mt-4">
          <Button size="sm" className="gap-2"><PlusCircle className="h-4 w-4" /> {t("File your first report")}</Button>
        </Link>
      )}
    </div>
  );
}

function FullSpinner() {
  return <div className="grid min-h-[40vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
}
