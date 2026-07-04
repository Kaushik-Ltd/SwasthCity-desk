import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Save, Globe, MapPin, Locate } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { LANGUAGES, type LanguageCode, isLanguageCode } from "@/lib/languages";
import { STATES, districtsFor, reverseGeocode, matchState } from "@/lib/regions";
import { getMyPreferences, updateMyPreferences } from "@/lib/onboarding.functions";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { language, setLanguage, t } = useI18n();
  const getPrefs = useServerFn(getMyPreferences);
  const savePrefs = useServerFn(updateMyPreferences);

  const prefsQ = useQuery({
    queryKey: ["my-prefs"],
    queryFn: () => getPrefs(),
  });

  const [selectedLang, setSelectedLang] = useState<LanguageCode>(language);
  const [stateVal, setStateVal] = useState("");
  const [districtVal, setDistrictVal] = useState("");
  const [cityVal, setCityVal] = useState("");
  const [muniVal, setMuniVal] = useState("");
  const [pinVal, setPinVal] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    const p = prefsQ.data;
    if (!p) return;
    if (isLanguageCode(p.preferred_language)) setSelectedLang(p.preferred_language);
    setStateVal(p.region_state ?? "");
    setDistrictVal(p.region_district ?? "");
    setCityVal(p.region_city ?? "");
    setMuniVal(p.region_municipality ?? "");
    setPinVal(p.region_pincode ?? "");
    setLat(p.region_lat ?? null);
    setLng(p.region_lng ?? null);
  }, [prefsQ.data]);

  const districts = useMemo(() => districtsFor(stateVal), [stateVal]);

  async function useMyLocation() {
    if (!navigator.geolocation) {
      toast.error(t("Geolocation is not supported on this device."));
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          setLat(latitude); setLng(longitude);
          const r = await reverseGeocode(latitude, longitude);
          const matched = matchState(r.state);
          if (matched) setStateVal(matched);
          if (r.district) setDistrictVal(r.district);
          if (r.city) setCityVal(r.city);
          if (r.municipality) setMuniVal(r.municipality);
          if (r.pincode) setPinVal(r.pincode);
          toast.success(t("Location detected"));
        } catch (e) {
          toast.error((e as Error).message);
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => { setGpsLoading(false); toast.error(err.message); },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  async function save() {
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
        },
      });
      if (selectedLang !== language) await setLanguage(selectedLang);
      toast.success(t("Preferences saved"));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold">{t("Settings")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("Update your language and region anytime.")}</p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{t("Language")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {LANGUAGES.map((l) => {
              const active = selectedLang === l.code;
              return (
                <button
                  key={l.code}
                  onClick={() => setSelectedLang(l.code)}
                  className={[
                    "flex flex-col items-start rounded-lg border p-3 text-left transition hover:border-primary",
                    active ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border",
                  ].join(" ")}
                  aria-pressed={active}
                  lang={l.code}
                >
                  <span className="text-base font-semibold" lang={l.code}>{l.native}</span>
                  <span className="text-xs text-muted-foreground">{l.english}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{t("Region")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="secondary" size="sm" className="gap-2" onClick={() => void useMyLocation()} disabled={gpsLoading}>
            {gpsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Locate className="h-4 w-4" />}
            {t("Use my current location")}
          </Button>

          <div className="grid gap-4 sm:grid-cols-2">
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
                <SelectTrigger><SelectValue placeholder={stateVal ? t("Select district") : t("Pick state first")} /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {districts.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("City / Town")}>
              <Input value={cityVal} onChange={(e) => setCityVal(e.target.value)} />
            </Field>
            <Field label={t("Municipality / Municipal Corporation")}>
              <Input value={muniVal} onChange={(e) => setMuniVal(e.target.value)} />
            </Field>
            <Field label={t("PIN code")}>
              <Input value={pinVal} onChange={(e) => setPinVal(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" />
            </Field>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => void save()} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t("Save changes")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
