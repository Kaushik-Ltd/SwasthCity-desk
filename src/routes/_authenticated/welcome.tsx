import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, MapPin, Locate, Check, Globe, ChevronRight, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { LANGUAGES, type LanguageCode } from "@/lib/languages";
import { STATES, districtsFor, reverseGeocode, matchState, type ReverseGeocodeResult } from "@/lib/regions";
import { updateMyPreferences } from "@/lib/onboarding.functions";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/welcome")({
  component: WelcomeScreen,
});

type Step = 1 | 2;

function WelcomeScreen() {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useI18n();
  const savePrefs = useServerFn(updateMyPreferences);

  const [step, setStep] = useState<Step>(1);
  const [selectedLang, setSelectedLang] = useState<LanguageCode>(language);

  // Region state
  const [mode, setMode] = useState<"gps" | "manual" | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsResult, setGpsResult] = useState<ReverseGeocodeResult | null>(null);
  const [stateVal, setStateVal] = useState<string>("");
  const [districtVal, setDistrictVal] = useState<string>("");
  const [cityVal, setCityVal] = useState<string>("");
  const [muniVal, setMuniVal] = useState<string>("");
  const [pinVal, setPinVal] = useState<string>("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const districts = useMemo(() => districtsFor(stateVal), [stateVal]);

  // Keep provider in sync as user previews their language choice.
  useEffect(() => {
    if (selectedLang !== language) setLanguage(selectedLang);
  }, [selectedLang, language, setLanguage]);

  async function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error(t("Geolocation is not supported on this device."));
      return;
    }
    setGpsLoading(true);
    setMode("gps");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          setLat(latitude);
          setLng(longitude);
          const r = await reverseGeocode(latitude, longitude);
          setGpsResult(r);
          const matched = matchState(r.state);
          if (matched) setStateVal(matched);
          if (r.district) setDistrictVal(r.district);
          if (r.city) setCityVal(r.city);
          if (r.municipality) setMuniVal(r.municipality);
          if (r.pincode) setPinVal(r.pincode);
          toast.success(t("Location detected"));
        } catch (e) {
          toast.error((e as Error).message || t("Could not detect location"));
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        toast.error(err.message || t("Location permission denied"));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }

  async function finish() {
    if (!stateVal) {
      toast.error(t("Please choose your state to continue."));
      return;
    }
    setSaving(true);
    try {
      await savePrefs({
        data: {
          preferred_language: selectedLang,
          region_state: stateVal || null,
          region_district: districtVal || null,
          region_city: cityVal || null,
          region_municipality: muniVal || null,
          region_pincode: pinVal || null,
          region_lat: lat,
          region_lng: lng,
          mark_onboarded: true,
        },
      });
      toast.success(t("You're all set!"));
      await navigate({ to: "/dashboard", replace: true });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-hero text-primary-foreground shadow-elev-1">
          <Globe className="h-7 w-7" />
        </div>
        <h1 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
          {t("Welcome to SwasthCity")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {t("Pick your language and region so we can route your reports to the right department.")}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3 text-xs">
          <StepDot n={1} active={step === 1} done={step > 1} label={t("Language")} />
          <div className="h-px w-8 bg-border" />
          <StepDot n={2} active={step === 2} done={false} label={t("Region")} />
        </div>
      </header>

      {step === 1 && (
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h2 className="mb-4 text-lg font-semibold">{t("Choose your language")}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {LANGUAGES.map((l) => {
              const active = selectedLang === l.code;
              return (
                <button
                  key={l.code}
                  onClick={() => setSelectedLang(l.code)}
                  className={[
                    "group relative flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition",
                    "hover:border-primary hover:shadow-elev-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    active ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card",
                  ].join(" ")}
                  aria-pressed={active}
                  lang={l.code}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-lg font-semibold">
                      {l.flag}
                    </span>
                    {active && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <span className="mt-1 text-lg font-semibold" lang={l.code}>{l.native}</span>
                  <span className="text-xs text-muted-foreground">{l.english}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex justify-end">
            <Button onClick={() => setStep(2)} className="gap-2">
              {t("Continue")} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
          <h2 className="text-lg font-semibold">{t("Set your region")}</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card
              className={[
                "cursor-pointer transition hover:shadow-elev-1",
                mode === "gps" ? "border-primary ring-1 ring-primary" : "",
              ].join(" ")}
              onClick={() => setMode("gps")}
              role="button"
              tabIndex={0}
            >
              <CardContent className="flex items-start gap-3 p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Locate className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{t("Use my current location")}</div>
                  <div className="text-xs text-muted-foreground">
                    {t("Detects your state, district, city and PIN using GPS.")}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-3 gap-2"
                    onClick={(e) => { e.stopPropagation(); void useMyLocation(); }}
                    disabled={gpsLoading}
                  >
                    {gpsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Locate className="h-4 w-4" />}
                    {gpsLoading ? t("Detecting…") : t("Detect location")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card
              className={[
                "cursor-pointer transition hover:shadow-elev-1",
                mode === "manual" ? "border-primary ring-1 ring-primary" : "",
              ].join(" ")}
              onClick={() => setMode("manual")}
              role="button"
              tabIndex={0}
            >
              <CardContent className="flex items-start gap-3 p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
                  <MapPin className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{t("Select manually")}</div>
                  <div className="text-xs text-muted-foreground">
                    {t("Pick your state, district, city and municipality.")}
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-primary">
                    {t("Choose")} <ChevronRight className="h-3 w-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {gpsResult && (
            <Card className="border-primary/40 bg-primary/5">
              <CardContent className="p-4 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <MapPin className="h-4 w-4 text-primary" /> {t("Detected location")}
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">{gpsResult.displayName}</p>
              </CardContent>
            </Card>
          )}

          {(mode || gpsResult) && (
            <div className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
              <Field label={t("State / UT")}>
                <Select value={stateVal} onValueChange={(v) => { setStateVal(v); setDistrictVal(""); }}>
                  <SelectTrigger><SelectValue placeholder={t("Select state")} /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {STATES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label={t("District")}>
                <Select value={districtVal} onValueChange={setDistrictVal} disabled={!stateVal}>
                  <SelectTrigger>
                    <SelectValue placeholder={stateVal ? t("Select district") : t("Pick state first")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {districts.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                    {districts.length === 0 && stateVal && (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">{t("No districts listed")}</div>
                    )}
                  </SelectContent>
                </Select>
              </Field>

              <Field label={t("City / Town")}>
                <Input value={cityVal} onChange={(e) => setCityVal(e.target.value)} placeholder={t("e.g. Ranchi")} />
              </Field>

              <Field label={t("Municipality / Municipal Corporation")}>
                <Input value={muniVal} onChange={(e) => setMuniVal(e.target.value)} placeholder={t("e.g. Ranchi Municipal Corporation")} />
              </Field>

              <Field label={t("PIN code")}>
                <Input value={pinVal} onChange={(e) => setPinVal(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="560001" inputMode="numeric" />
              </Field>

              {lat !== null && lng !== null && (
                <Field label={t("Coordinates")}>
                  <Badge variant="secondary" className="w-fit font-mono text-[11px]">
                    {lat.toFixed(4)}, {lng.toFixed(4)}
                  </Badge>
                </Field>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep(1)}>{t("Back")}</Button>
            <Button onClick={() => void finish()} disabled={saving || !stateVal} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {t("Finish and continue")}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

function StepDot({ n, active, done, label }: { n: number; active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={[
          "grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold transition",
          done ? "bg-primary text-primary-foreground" : active ? "bg-primary/15 text-primary ring-2 ring-primary" : "bg-muted text-muted-foreground",
        ].join(" ")}
      >
        {done ? <Check className="h-3.5 w-3.5" /> : n}
      </span>
      <span className={active || done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}
