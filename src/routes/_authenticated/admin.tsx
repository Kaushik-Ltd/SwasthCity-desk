import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Shield, ShieldAlert, User as UserIcon, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { listUsers, assignRole, removeRole } from "@/lib/admin.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DEPARTMENTS, labelOf } from "@/lib/civic";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
    if (!data) throw redirect({ to: "/dashboard" });
  },
  component: AdminPage,
});

type AdminUser = {
  id: string; email: string; created_at: string;
  profile: { full_name: string | null; department: string | null } | null;
  roles: string[];
};

function AdminPage() {
  const qc = useQueryClient();
  const { t } = useI18n();
  const listFn = useServerFn(listUsers);
  const assignFn = useServerFn(assignRole);
  const removeFn = useServerFn(removeRole);
  const [assignTarget, setAssignTarget] = useState<AdminUser | null>(null);
  const [role, setRole] = useState<"citizen" | "authority" | "admin">("authority");
  const [dept, setDept] = useState<string>("public_works");

  const q = useQuery({ queryKey: ["admin-users"], queryFn: () => listFn() });

  const assign = useMutation({
    mutationFn: () => {
      if (!assignTarget) throw new Error(t("No target"));
      return assignFn({ data: { userId: assignTarget.id, role, department: role === "authority" ? (dept as never) : undefined } });
    },
    onSuccess: () => {
      toast.success(t("Role assigned"));
      setAssignTarget(null);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : t("Failed")),
  });

  const revoke = useMutation({
    mutationFn: (v: { userId: string; role: string }) => removeFn({ data: { userId: v.userId, role: v.role as never } }),
    onSuccess: () => {
      toast.success(t("Role removed"));
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : t("Failed")),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">{t("Administration")}</h1>
        <p className="text-sm text-muted-foreground">{t("Grant authority or admin access, and assign authorities to departments.")}</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">{t("Users")}</CardTitle></CardHeader>
        <CardContent>
          {q.isLoading ? (
            <div className="grid place-items-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="divide-y divide-border">
              {(q.data ?? []).map((u: AdminUser) => (
                <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 font-medium">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      {u.profile?.full_name || u.email}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {u.email}
                      {u.profile?.department && <> · {t(labelOf(DEPARTMENTS, u.profile.department))}</>}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {u.roles.map((r) => (
                      <Badge key={r} variant={r === "admin" ? "default" : "outline"} className="gap-1 capitalize">
                        {r === "admin" ? <ShieldAlert className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                        {t(r)}
                        <button className="ml-1 opacity-60 hover:opacity-100" onClick={() => revoke.mutate({ userId: u.id, role: r })} aria-label={t("Remove role")}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    <Button size="sm" variant="outline" onClick={() => setAssignTarget(u)}>{t("Assign role")}</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!assignTarget} onOpenChange={(o) => !o && setAssignTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Assign role")}</DialogTitle>
            <DialogDescription>{assignTarget?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={role} onValueChange={(v) => setRole(v as never)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="citizen">{t("Citizen")}</SelectItem>
                <SelectItem value="authority">{t("Authority")}</SelectItem>
                <SelectItem value="admin">{t("Admin")}</SelectItem>
              </SelectContent>
            </Select>
            {role === "authority" && (
              <Select value={dept} onValueChange={setDept}>
                <SelectTrigger><SelectValue placeholder={t("Department")} /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => <SelectItem key={d.value} value={d.value}>{t(d.label)}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Button className="w-full" onClick={() => assign.mutate()} disabled={assign.isPending}>
              {assign.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Assign")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
