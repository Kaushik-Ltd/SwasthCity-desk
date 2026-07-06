import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Building2, Phone, Mail, Globe, MapPin, Loader2, AlertCircle,
  Truck, Construction, Droplets, Lightbulb, Waves, HeartPulse, PhoneCall,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { getMyPreferences } from "@/lib/onboarding.functions";
import { lookupCivicAuthority, type DepartmentKey, type CivicAuthority } from "@/lib/civic-authority";

const DEPT_ICONS: Record<DepartmentKey, React.ComponentType<{ className?: string }>> = {
  general: Building2,
  roads: Construction,
  sanitation: Truck,
  water: Droplets,
  streetlights: Lightbulb,
  drainage: Waves,
  public_health: HeartPulse,
};

export function CivicAuthorityCard() {
  const { t } = useI18n();
  const getPrefs = useServerFn(getMyPreferences);

  const prefsQ = useQuery({
    queryKey: ["my-prefs"],
    queryFn: () => getPrefs(),
    staleTime: 5 * 60_000,
  });

  const p = prefsQ.data;
  const authQ = useQuery({
    queryKey: ["civic-authority", p?.region_state, p?.region_district, p?.region_city, p?.region_municipality, p?.region_pincode],
    enabled: !!p,
    staleTime: 10 * 60_000,
    queryFn: () => lookupCivicAuthority({
      state: p?.region_state ?? null,
      district: p?.region_district ?? null,
      city: p?.region_city ?? null,
      municipality: p?.region_municipality ?? null,
      pincode: p?.region_pincode ?? null,
      lat: p?.region_lat ?? null,
      lng: p?.region_lng ?? null,
    }),
  });

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <Building2 className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <CardTitle className="text-lg">{t("Your Local Civic Authority")}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {t("Contacts routed from your saved region.")}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {prefsQ.isLoading || authQ.isLoading ? (
          <div className="grid place-items-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : !authQ.data ? (
          <Unavailable message={t("Municipality information is currently unavailable for this location.")} />
        ) : (
          <AuthorityView data={authQ.data} />
        )}
      </CardContent>
    </Card>
  );
}

function AuthorityView({ data }: { data: CivicAuthority }) {
  const { t } = useI18n();
  const mapQuery = encodeURIComponent(data.address || data.municipality);
  const mapsUrl = data.lat && data.lng
    ? `https://www.google.com/maps/search/?api=1&query=${data.lat},${data.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-semibold">{data.municipality}</h3>
              {data.corporation && <Badge variant="secondary">{data.corporation}</Badge>}
            </div>
            {data.ward && <p className="mt-0.5 text-xs text-muted-foreground">{t("Ward")}: {data.ward}</p>}
            {data.address && (
              <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {data.address}
              </p>
            )}
          </div>
        </div>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <InfoRow icon={Truck}    label={t("Garbage helpline")}    value={data.helplines.garbage} type="tel" />
          <InfoRow icon={Construction} label={t("Road/pothole helpline")} value={data.helplines.roads} type="tel" />
          <InfoRow icon={PhoneCall} label={t("General complaint")}   value={data.helplines.general} type="tel" />
          <InfoRow icon={AlertCircle} label={t("Emergency")}          value={data.helplines.emergency} type="tel" />
          <InfoRow icon={Mail}      label={t("Official email")}       value={data.email} type="mail" />
          <InfoRow icon={Globe}     label={t("Official website")}     value={data.website} type="url" />
        </dl>

        <div className="mt-5 flex flex-wrap gap-2">
          {(data.helplines.general || data.helplines.emergency) && (
            <a href={`tel:${data.helplines.general ?? data.helplines.emergency}`}>
              <Button size="sm" className="gap-2"><Phone className="h-4 w-4" /> {t("Call Municipality")}</Button>
            </a>
          )}
          {data.email && (
            <a href={`mailto:${data.email}`}>
              <Button size="sm" variant="secondary" className="gap-2"><Mail className="h-4 w-4" /> {t("Send Email")}</Button>
            </a>
          )}
          {data.website && (
            <a href={data.website} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="secondary" className="gap-2"><Globe className="h-4 w-4" /> {t("Visit Website")}</Button>
            </a>
          )}
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="gap-2"><MapPin className="h-4 w-4" /> {t("Open on Google Maps")}</Button>
          </a>
        </div>
      </div>

      {data.departments.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-semibold text-muted-foreground">{t("Departments")}</h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.departments.map((d) => {
              const Icon = DEPT_ICONS[d.key] ?? Building2;
              return (
                <div
                  key={d.key}
                  className="group rounded-lg border border-border bg-card p-4 transition hover:border-primary hover:shadow-elev-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="font-medium">{d.name}</div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {d.phone && (
                      <a href={`tel:${d.phone}`} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 hover:bg-primary/10 hover:text-primary">
                        <Phone className="h-3 w-3" /> {d.phone}
                      </a>
                    )}
                    {d.email && (
                      <a href={`mailto:${d.email}`} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 hover:bg-primary/10 hover:text-primary">
                        <Mail className="h-3 w-3" /> {t("Email")}
                      </a>
                    )}
                    {!d.phone && !d.email && (
                      <span className="text-muted-foreground">{t("Contact via general helpline")}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.source === "mock" && (
        <p className="text-[11px] text-muted-foreground">
          {t("Directory data is indicative. Verify with the official portal before urgent contact.")}
        </p>
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon, label, value, type,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string;
  type: "tel" | "mail" | "url" | "text";
}) {
  if (!value) return null;
  const href = type === "tel" ? `tel:${value}` : type === "mail" ? `mailto:${value}` : type === "url" ? value : undefined;
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        {href ? (
          <a href={href} target={type === "url" ? "_blank" : undefined} rel="noopener noreferrer" className="truncate font-medium text-foreground hover:text-primary hover:underline">
            {value}
          </a>
        ) : (
          <div className="truncate font-medium">{value}</div>
        )}
      </div>
    </div>
  );
}

function Unavailable({ message }: { message: string }) {
  return (
    <div className="grid place-items-center gap-2 py-10 text-center">
      <AlertCircle className="h-6 w-6 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
