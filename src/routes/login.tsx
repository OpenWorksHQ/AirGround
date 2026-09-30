import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AMark, Logo } from "@/components/brand";
import { Button, Field, inputStyles } from "@/components/ag";
import { useAuth } from "@/hooks/use-auth";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — AIRGROUND Home Services" },
      { name: "description", content: "Sign in to manage your AirGround services and home care plan." },
      { property: "og:title", content: "Sign in — AIRGROUND" },
      { property: "og:description", content: "Manage your AirGround services and home care plan." },
    ],
  }),
  component: LoginPage,
});

const safePath = (value: string | undefined) =>
  value && value.startsWith("/") && !value.startsWith("//") ? value : "/account";

function LoginPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const target = safePath(redirect);

  useEffect(() => {
    if (user) navigate({ to: target, replace: true });
  }, [user, target, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: target, replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}${target}`,
          },
        });
        if (error) throw error;
        if (!data.session) setCheckEmail(true);
        else navigate({ to: target, replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "That didn't work. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in didn't complete.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: target, replace: true });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_520px]">
      <div className="relative hidden overflow-hidden border-r border-border bg-paper lg:block">
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-[80%] w-[80%]">
          <AMark className="h-full w-full" />
        </div>
        <div className="relative p-10">
          <Logo />
          <h1 className="display-xl mt-24 max-w-sm text-[3rem]">
            Everything for your property, in one place.
          </h1>
          <p className="mt-4 max-w-sm text-muted-foreground">
            Your requests, upcoming visits and ongoing care plan all live in your AirGround account.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>

          {checkEmail ? (
            <div className="mt-8">
              <h2 className="display-xl text-[2rem]">Check your email</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                We sent a confirmation link to {email}. Open it and you'll come right back here —
                anything you already entered is saved.
              </p>
              <Link
                to="/"
                className="mt-6 inline-flex text-sm font-semibold text-primary hover:underline"
              >
                Back to home
              </Link>
            </div>
          ) : (
            <>
              <h2 className="display-xl mt-8 text-[2rem]">
                {mode === "signin" ? "Welcome back." : "Create your account."}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {mode === "signin"
                  ? "Sign in to see your home and upcoming services."
                  : "One account for booking, scheduling and ongoing care."}
              </p>

              <button
                type="button"
                onClick={google}
                className="mt-7 h-12 w-full rounded-lg border border-border-strong text-sm font-semibold hover:bg-secondary"
              >
                Continue with Google
              </button>

              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={submit} className="space-y-4">
                {mode === "signup" ? (
                  <Field label="Full name">
                    <input
                      className={inputStyles}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      autoComplete="name"
                    />
                  </Field>
                ) : null}
                <Field label="Email">
                  <input
                    className={inputStyles}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </Field>
                <Field label="Password">
                  <input
                    className={inputStyles}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  />
                </Field>
                <Button type="submit" size="lg" className="w-full" disabled={busy}>
                  {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
                </Button>
              </form>

              <p className="mt-6 text-sm text-muted-foreground">
                {mode === "signin" ? "New to AirGround?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  className="font-semibold text-primary hover:underline"
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                >
                  {mode === "signin" ? "Create an account" : "Sign in"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
