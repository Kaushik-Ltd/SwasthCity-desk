import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Shield, Mail, Lock, User as UserIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({ component: AuthPage });

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(8, "At least 8 characters").max(72);
const nameSchema = z.string().trim().min(2, "Enter your name").max(80);

async function routeAfterAuth(): Promise<"/welcome" | "/dashboard"> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return "/dashboard";
  const { data: prof } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("id", uid)
    .maybeSingle();
  return prof?.onboarded_at ? "/dashboard" : "/welcome";
}

function AuthPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [tab, setTab] = useState<"signin" | "signup" | "forgot">("signin");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const to = await routeAfterAuth();
        navigate({ to, replace: true });
      }
    });
  }, [navigate]);

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-hero lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,oklch(0.78_0.15_70/0.3),transparent_55%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15"><Shield className="h-5 w-5" /></span>
            SwasthCity
          </Link>
          <div className="max-w-md">
            <h1 className="font-display text-4xl font-semibold leading-tight">{t("Report a broken streetlight in under 30 seconds.")}</h1>
            <p className="mt-4 text-primary-foreground/80">{t("Sign in as a citizen to file reports, or as an authority to triage your department's queue.")}</p>
          </div>
          <div className="text-xs text-primary-foreground/60">{t("Your reports are private to you and the assigned department.")}</div>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <Card className="w-full max-w-md border-border shadow-elev-2">
          <CardHeader>
            <CardTitle className="font-display text-2xl">
              {tab === "forgot" ? t("Reset password") : tab === "signup" ? t("Create your account") : t("Welcome back")}
            </CardTitle>
            <CardDescription>
              {tab === "forgot" ? t("We'll email you a reset link.") : tab === "signup" ? t("Get started with a free citizen account.") : t("Sign in to continue to SwasthCity.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tab === "forgot" ? (
              <ForgotForm onBack={() => setTab("signin")} />
            ) : (
              <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">{t("Sign in")}</TabsTrigger>
                  <TabsTrigger value="signup">{t("Sign up")}</TabsTrigger>
                </TabsList>
                <TabsContent value="signin" className="mt-6">
                  <SignInForm onForgot={() => setTab("forgot")} />
                </TabsContent>
                <TabsContent value="signup" className="mt-6">
                  <SignUpForm />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GoogleButton() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  async function go() {
    setLoading(true);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) { toast.error(res.error.message); setLoading(false); return; }
    if (res.redirected) return;
    const to = await routeAfterAuth();
    navigate({ to, replace: true });
  }
  return (
    <Button variant="outline" className="w-full gap-2" onClick={go} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
      {t("Continue with Google")}
    </Button>
  );
}

function SignInForm({ onForgot }: { onForgot: () => void }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = emailSchema.safeParse(email);
    if (!p.success) { toast.error(t(p.error.issues[0].message)); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: p.data, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(t("Signed in"));
    const to = await routeAfterAuth();
    navigate({ to, replace: true });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <GoogleButton />
      <Divider />
      <Field icon={Mail} label={t("Email")} type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
      <Field icon={Lock} label={t("Password")} type="password" value={password} onChange={setPassword} placeholder="••••••••" autoComplete="current-password" />
      <button type="button" onClick={onForgot} className="text-xs font-medium text-primary hover:underline">{t("Forgot password?")}</button>
      <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Sign in")}</Button>
    </form>
  );
}

function SignUpForm() {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = nameSchema.safeParse(name);
    const em = emailSchema.safeParse(email);
    const pw = passwordSchema.safeParse(password);
    if (!n.success) return toast.error(t(n.error.issues[0].message));
    if (!em.success) return toast.error(t(em.error.issues[0].message));
    if (!pw.success) return toast.error(t(pw.error.issues[0].message));
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: em.data,
      password: pw.data,
      options: { emailRedirectTo: window.location.origin, data: { full_name: n.data } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(t("Account created — check your email if confirmation is required."));
    window.location.href = "/welcome";
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <GoogleButton />
      <Divider />
      <Field icon={UserIcon} label={t("Full name")} value={name} onChange={setName} placeholder={t("Ada Lovelace")} autoComplete="name" />
      <Field icon={Mail} label={t("Email")} type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
      <Field icon={Lock} label={t("Password")} type="password" value={password} onChange={setPassword} placeholder={t("At least 8 characters")} autoComplete="new-password" />
      <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Create account")}</Button>
    </form>
  );
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = emailSchema.safeParse(email);
    if (!p.success) return toast.error(t(p.error.issues[0].message));
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(p.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(t("If an account exists, a reset link is on its way."));
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field icon={Mail} label={t("Email")} type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
      <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Send reset link")}</Button>
      <button type="button" onClick={onBack} className="w-full text-xs font-medium text-muted-foreground hover:text-foreground">{t("Back to sign in")}</button>
    </form>
  );
}

function Field({ icon: Icon, label, ...rest }: { icon: React.ComponentType<{ className?: string }>; label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string; autoComplete?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" type={rest.type ?? "text"} value={rest.value} onChange={(e) => rest.onChange(e.target.value)} placeholder={rest.placeholder} autoComplete={rest.autoComplete} />
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
      <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.2-5.5 4.2-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.9 1.5l2.6-2.6C16.9 3.5 14.7 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.5 0 9.1-3.8 9.1-9.2 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}
