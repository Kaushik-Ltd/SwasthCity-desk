import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUSES, SEVERITIES, DEPARTMENTS, CATEGORIES, labelOf, severityColor, statusColor, type Status, type Severity, type Department } from "@/lib/civic";
import { useAuth, primaryRole } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/reports/")({ component: ReportsList });

type Row = {
  id: string; title: string; description: string | null; status: Status; severity: Severity;
  department: Department; category: string; created_at: string; reporter_id: string;
};

function ReportsList() {
  const { roles } = useAuth();
  const role = primaryRole(roles);
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [severity, setSeverity] = useState<string>("all");

  const q = useQuery({
    queryKey: ["reports-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports").select("id,title,description,status,severity,department,category,created_at,reporter_id")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    const rows = q.data ?? [];
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (severity !== "all" && r.severity !== severity) return false;
      if (search && !`${r.title} ${r.description ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [q.data, status, severity, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">{t("Reports")}</h1>
          <p className="text-sm text-muted-foreground">
            {role === "citizen" ? t("The reports you've filed.") : role === "authority" ? t("Reports assigned to your department.") : t("Every report across the platform.")}
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

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 py-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder={t("Search reports…")} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder={t("Status")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All statuses")}</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{t(s.label)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder={t("Severity")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All severities")}</SelectItem>
              {SEVERITIES.map((s) => <SelectItem key={s.value} value={s.value}>{t(s.label)}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {q.isLoading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="grid place-items-center py-16 text-sm text-muted-foreground">{t("No reports match your filters.")}</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => (
            <Link key={r.id} to="/reports/$id" params={{ id: r.id }}>
              <Card className="transition hover:border-primary/40 hover:shadow-elev-2">
                <CardContent className="flex flex-wrap items-start justify-between gap-4 py-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{t(labelOf(CATEGORIES, r.category))}</Badge>
                      <Badge className={severityColor(r.severity)}>{t(labelOf(SEVERITIES, r.severity))}</Badge>
                      <Badge className={statusColor(r.status)} variant="secondary">{t(labelOf(STATUSES, r.status))}</Badge>
                    </div>
                    <h3 className="mt-2 truncate text-lg font-semibold">{r.title}</h3>
                    {r.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t(labelOf(DEPARTMENTS, r.department))} · {new Date(r.created_at).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
