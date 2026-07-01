import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, MapPin, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, primaryRole } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUSES, SEVERITIES, DEPARTMENTS, CATEGORIES, labelOf, severityColor, statusColor, type Status } from "@/lib/civic";

export const Route = createFileRoute("/_authenticated/reports/$id")({ component: ReportDetail });

function useSignedUrls(paths: string[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries: [string, string][] = [];
      for (const p of paths) {
        const { data } = await supabase.storage.from("report-media").createSignedUrl(p, 60 * 60);
        if (data?.signedUrl) entries.push([p, data.signedUrl]);
      }
      if (!cancelled) setUrls(Object.fromEntries(entries));
    })();
    return () => { cancelled = true; };
  }, [paths.join("|")]);
  return urls;
}

function ReportDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { user, roles } = useAuth();
  const role = primaryRole(roles);

  const q = useQuery({
    queryKey: ["report", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("reports").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Report not found");
      return data;
    },
  });

  const updates = useQuery({
    queryKey: ["report-updates", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("report_updates").select("*").eq("report_id", id).order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const media = useSignedUrls((q.data?.media_urls ?? []) as string[]);

  const [message, setMessage] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");

  const postUpdate = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (!message.trim() && !newStatus) throw new Error("Nothing to post");
      const insert = {
        report_id: id,
        author_id: user.id,
        message: message.trim() || `Status changed to ${labelOf(STATUSES, newStatus as Status)}`,
        new_status: newStatus ? (newStatus as never) : null,
      };
      const { error } = await supabase.from("report_updates").insert(insert);
      if (error) throw error;
      if (newStatus && (role === "authority" || role === "admin")) {
        const { error: upErr } = await supabase.from("reports").update({ status: newStatus as never }).eq("id", id);
        if (upErr) throw upErr;
      }
    },
    onSuccess: () => {
      setMessage(""); setNewStatus("");
      qc.invalidateQueries({ queryKey: ["report", id] });
      qc.invalidateQueries({ queryKey: ["report-updates", id] });
      toast.success("Update posted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (q.isLoading) return <div className="grid min-h-[40vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (q.error) return <div className="text-sm text-destructive">{(q.error as Error).message}</div>;
  const r = q.data!;
  const canAct = role === "authority" || role === "admin";
  const canComment = canAct || r.reporter_id === user?.id;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/reports" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to reports
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{labelOf(CATEGORIES, r.category)}</Badge>
            <Badge className={severityColor(r.severity)}>{labelOf(SEVERITIES, r.severity)}</Badge>
            <Badge className={statusColor(r.status)} variant="secondary">{labelOf(STATUSES, r.status)}</Badge>
          </div>
          <h1 className="mt-3 font-display text-3xl font-semibold">{r.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Filed {new Date(r.created_at).toLocaleString()} · Assigned to {labelOf(DEPARTMENTS, r.department)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {Object.values(media).length > 0 && (
            <Card>
              <CardContent className="grid gap-3 py-4 sm:grid-cols-2">
                {(r.media_urls as string[]).map((p) => (
                  <div key={p} className="overflow-hidden rounded-lg border border-border bg-muted">
                    {media[p] ? (
                      p.match(/\.(mp4|mov|webm)$/i) ? (
                        <video src={media[p]} controls className="w-full" />
                      ) : (
                        <img src={media[p]} alt="Report media" className="w-full object-cover" />
                      )
                    ) : (
                      <div className="grid h-40 place-items-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {r.description && (
            <Card>
              <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
              <CardContent className="text-sm leading-relaxed">{r.description}</CardContent>
            </Card>
          )}

          {r.ai_analysis && (
            <Card className="border-primary/30 bg-primary/[0.03]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" /> AI analysis
                  {typeof r.ai_confidence === "number" && (
                    <Badge variant="outline" className="ml-auto">Confidence {Math.round(r.ai_confidence * 100)}%</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {(r.ai_analysis as { reasoning?: string })?.reasoning ?? "Analyzed automatically."}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Activity</CardTitle></CardHeader>
            <CardContent>
              {updates.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (updates.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No updates yet.</p>
              ) : (
                <ol className="space-y-4">
                  {(updates.data ?? []).map((u) => (
                    <li key={u.id} className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                      <div className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleString()}</div>
                      <div className="mt-1">{u.message}</div>
                      {u.new_status && <Badge className={statusColor(u.new_status as Status)} variant="secondary">Status: {labelOf(STATUSES, u.new_status)}</Badge>}
                    </li>
                  ))}
                </ol>
              )}

              {canComment && (
                <div className="mt-4 space-y-3 border-t border-border pt-4">
                  <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={canAct ? "Post an update to the citizen…" : "Add more context to your report…"} rows={3} maxLength={800} />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {canAct && (
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger className="w-[200px]"><SelectValue placeholder="Change status (optional)" /></SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                    <Button onClick={() => postUpdate.mutate()} disabled={postUpdate.isPending} className="gap-2 ml-auto">
                      {postUpdate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Post update
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Location</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {r.location_text ? (
                <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" /><span>{r.location_text}</span></div>
              ) : <span className="text-muted-foreground">No address given</span>}
              {typeof r.latitude === "number" && typeof r.longitude === "number" && (
                <a className="block text-primary hover:underline" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${r.latitude}&mlon=${r.longitude}#map=17/${r.latitude}/${r.longitude}`}>
                  View on map ↗
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
