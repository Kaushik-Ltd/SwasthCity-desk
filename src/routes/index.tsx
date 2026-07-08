import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Zap, Route as RouteIcon, ShieldCheck, LineChart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const { t } = useI18n();
  const STEPS = [
    { icon: Camera, title: t("Snap & submit"), body: t("Citizens upload a photo or short video of the issue with an optional note.") },
    { icon: Zap, title: t("AI analyzes"), body: t("Our model classifies the issue, rates its severity and drafts a report title.") },
    { icon: RouteIcon, title: t("Routed to the right desk"), body: t("The correct department is notified automatically — no bouncing tickets.") },
  ];
  const FEATURES = [
    { icon: ShieldCheck, title: t("Trust & transparency"), body: t("Every report gets an audit trail visible to the citizen who filed it.") },
    { icon: LineChart, title: t("Severity you can act on"), body: t("AI grades urgency from low to critical so authorities triage instantly.") },
    { icon: Users, title: t("Built for three roles"), body: t("Purpose-made views for citizens, government authorities and administrators.") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,oklch(0.78_0.15_70/0.25),transparent_55%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-primary-foreground/80">
              {t("AI-powered civic reporting")}
            </span>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] text-primary-foreground sm:text-6xl">
              {t("A smarter way for cities to hear their citizens.")}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-primary-foreground/85">
              {t("SwasthCity turns a single photo into a routed, prioritised civic report — connecting citizens directly to the government team that can fix it.")}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-accent text-accent-foreground shadow-elev-2 hover:opacity-95">
                  {t("Report an issue")}
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="border-white/30 bg-white/10 text-primary-foreground hover:bg-white/20">
                  {t("I'm an authority")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-border bg-card p-8 shadow-elev-1">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><s.icon className="h-5 w-5" /></span>
                <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{t("Step")} {i + 1}</span>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <h2 className="max-w-2xl font-display text-3xl font-semibold text-foreground sm:text-4xl">
            {t("Faster reporting, sharper triage, real accountability.")}
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl bg-card p-6 shadow-elev-1">
                <f.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">{t("Ready to make your neighbourhood better?")}</h2>
        <p className="mt-4 text-muted-foreground">{t("Create a free citizen account in seconds and file your first report.")}</p>
        <div className="mt-8">
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-accent text-accent-foreground hover:opacity-95">{t("Get started free")}</Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 text-xs text-muted-foreground sm:px-6">
          <span>© {new Date().getFullYear()} SwasthCity</span>
          <span>{t("Built for citizens & governments")}</span>
        </div>
      </footer>
    </div>
  );
}
