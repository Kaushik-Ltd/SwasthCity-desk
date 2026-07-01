import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Camera, Loader2, Sparkles, MapPin, Upload, X } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { analyzeReport } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, DEPARTMENTS, SEVERITIES, labelOf, severityColor } from "@/lib/civic";

export const Route = createFileRoute("/_authenticated/reports/new")({ component: NewReport });

const titleSchema = z.string().trim().min(3, "Title is too short").max(120);

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = () => rej(new Error("Could not read file"));
    r.onload = () => {
      const s = String(r.result ?? "");
      const [meta, b64] = s.split(",");
      const mime = meta.match(/data:(.*?);/)?.[1] ?? file.type ?? "image/jpeg";
      res({ base64: b64 ?? "", mimeType: mime });
    };
    r.readAsDataURL(file);
  });
}

function NewReport() {
  const navigate = useNavigate();
  const analyzeFn = useServerFn(analyzeReport);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [location, setLocation] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ai, setAi] = useState<null | { title: string; description: string; category: string; severity: string; department: string; confidence: number; reasoning: string }>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("other");
  const [severity, setSeverity] = useState<string>("medium");
  const [department, setDepartment] = useState<string>("general");

  function onFile(f: File | null) {
    setFile(f); setAi(null); setTitle(""); setDescription("");
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function runAnalysis() {
    if (!file) return toast.error("Please upload a photo first");
    if (!file.type.startsWith("image/")) return toast.error("AI analysis supports image uploads");
    setAnalyzing(true);
    try {
      const { base64, mimeType } = await fileToBase64(file);
      const result = await analyzeFn({ data: { imageBase64: base64, mimeType, userNote: note } });
      setAi(result);
      setTitle(result.title); setDescription(result.description);
      setCategory(result.category); setSeverity(result.severity); setDepartment(result.department);
      toast.success("AI analysis complete");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed");
    } finally { setAnalyzing(false); }
  }

  function detectLocation() {
    if (!navigator.geolocation) return toast.error("Geolocation unavailable");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success("Location captured");
      },
      () => toast.error("Could not get location"),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = titleSchema.safeParse(title);
    if (!t.success) return toast.error(t.error.issues[0].message);
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");

      const media_urls: string[] = [];
      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${uid}/${crypto.randomUUID()}.${ext}`;
        const up = await supabase.storage.from("report-media").upload(path, file, { contentType: file.type });
        if (up.error) throw up.error;
        media_urls.push(path);
      }

      const { data, error } = await supabase.from("reports").insert({
        reporter_id: uid,
        title: t.data,
        description: description || null,
        category: category as never,
        severity: severity as never,
        department: department as never,
        location_text: location || null,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        media_urls,
        ai_analysis: ai ? (ai as never) : null,
        ai_confidence: ai?.confidence ?? null,
      }).select("id").single();
      if (error) throw error;
      toast.success("Report submitted");
      navigate({ to: "/reports/$id", params: { id: data.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally { setSaving(false); }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Report an issue</h1>
        <p className="text-sm text-muted-foreground">Upload a photo — AI will classify the issue, gauge severity and route it to the correct department.</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">1 · Photo or video</CardTitle>
            <CardDescription>Clear photos help our AI classify accurately.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
            {preview ? (
              <div className="relative overflow-hidden rounded-xl border border-border">
                {file?.type.startsWith("video/") ? (
                  <video src={preview} controls className="w-full max-h-[420px] bg-black" />
                ) : (
                  <img src={preview} alt="Preview" className="w-full max-h-[420px] object-contain bg-muted" />
                )}
                <button type="button" onClick={() => onFile(null)} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-background/90 shadow-elev-1 hover:bg-background">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => inputRef.current?.click()} className="grid w-full place-items-center gap-2 rounded-xl border-2 border-dashed border-border py-14 text-muted-foreground transition hover:border-primary hover:bg-muted/40">
                <Upload className="h-8 w-8" />
                <span className="text-sm font-medium">Click to upload a photo or short video</span>
                <span className="text-xs">JPG, PNG, MP4 · up to 20 MB</span>
              </button>
            )}
            <div className="space-y-1.5">
              <Label>Notes for the AI (optional)</Label>
              <Textarea placeholder="e.g. 'This has been here for a week and cars have to swerve.'" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
            </div>
            <Button type="button" onClick={runAnalysis} disabled={!file || analyzing} className="gap-2">
              {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {analyzing ? "Analyzing…" : ai ? "Re-run AI analysis" : "Analyze with AI"}
            </Button>
          </CardContent>
        </Card>

        {ai && (
          <Card className="border-primary/40 bg-primary/[0.03]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-4 w-4 text-primary" /> AI classification
                <Badge variant="outline" className="ml-auto">Confidence {Math.round(ai.confidence * 100)}%</Badge>
              </CardTitle>
              <CardDescription>Review — you can adjust any field before submitting.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge>{labelOf(CATEGORIES, ai.category)}</Badge>
                <Badge className={severityColor(ai.severity as never)}>{labelOf(SEVERITIES, ai.severity)} severity</Badge>
                <Badge variant="secondary">{labelOf(DEPARTMENTS, ai.department)}</Badge>
              </div>
              {ai.reasoning && <p className="mt-3 text-sm text-muted-foreground italic">"{ai.reasoning}"</p>}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">2 · Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short summary" maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={1000} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Severity</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SEVERITIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DEPARTMENTS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">3 · Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Address or landmark</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. 12 Maple Street, near the park" maxLength={200} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={detectLocation} className="gap-2">
                <MapPin className="h-4 w-4" /> Use my current location
              </Button>
              {coords && (
                <span className="text-xs text-muted-foreground">📍 {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => navigate({ to: "/dashboard" })}>Cancel</Button>
          <Button type="submit" disabled={saving} className="gap-2 bg-gradient-accent text-accent-foreground hover:opacity-95">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            Submit report
          </Button>
        </div>
      </form>
    </div>
  );
}
