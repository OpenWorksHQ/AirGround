import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button, Field, inputStyles } from "@/components/ag";
import { AMark, Logo } from "@/components/brand";
import { signOutEverywhere, useAuth, useIsAdmin } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { claimAdminAccess } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Portal — AIRGROUND Home Services" },
      { name: "description", content: "Operational portal for AirGround requests, schedule and coverage." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin Portal — AIRGROUND" },
      { property: "og:description", content: "Operational portal for the AirGround team." },
    ],
  }),
  component: AdminLayout,
});

const TABS = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/requests", label: "Requests", exact: false },
  { to: "/admin/schedule", label: "Schedule", exact: false },
  { to: "/admin/customers", label: "Customers", exact: false },
  { to: "/admin/services", label: "Services & Pricing", exact: false },
  { to: "/admin/service-areas", label: "Service Areas", exact: false },
] as const;

function AdminLayout() {
  const { user, loading } = useAuth();
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();

  if (loading || (user && roleLoading)) {
    return <Centered>Checking access…</Centered>;
  }

  if (!user) return <AdminLogin />;
  if (!isAdmin) return <NoAccess />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-paper">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-10">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="rounded-md bg-primary px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-primary-foreground">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
              Customer site
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await signOutEverywhere();
                navigate({ to: "/", replace: true });
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-5 lg:px-10">
          {TABS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              activeOptions={{ exact: t.exact }}
              activeProps={{ className: "border-foreground text-foreground" }}
              inactiveProps={{ className: "border-transparent text-muted-foreground" }}
              className="whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold hover:text-foreground"
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-[1400px] px-5 py-8 lg:px-10">
        <Outlet />
      </main>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error("Those credentials didn't work.");
  };

  return (
    <div className="grid min-h-screen place-items-center bg-paper px-5">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-panel">
        <div className="pointer-events-none absolute -right-14 -top-10 h-40 w-40 opacity-[0.07]">
          <AMark className="h-full w-full" />
        </div>
        <Logo />
        <h1 className="display-xl mt-8 text-[1.8rem]">Admin Portal</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Operational access for the AirGround team.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
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
              autoComplete="current-password"
            />
          </Field>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <Link
          to="/"
          className="mt-6 inline-flex text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          Back to the customer site
        </Link>
      </div>
    </div>
  );
}

function NoAccess() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const claim = async () => {
    setBusy(true);
    try {
      const result = await claimAdminAccess();
      if (result.granted) {
        toast.success("Admin access granted.");
        queryClient.invalidateQueries({ queryKey: ["is-admin"] });
      } else {
        toast.error(result.reason ?? "Admin access is already assigned.");
      }
    } catch {
      toast.error("Couldn't set up admin access.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-paper px-5">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-panel">
        <Logo />
        <h1 className="display-xl mt-8 text-[1.8rem]">This account isn't staff.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ask an AirGround admin to add you. If this is a brand-new AirGround setup and no admin
          exists yet, you can claim it now.
        </p>
        <Button className="mt-6 w-full" size="lg" onClick={claim} disabled={busy}>
          {busy ? "Setting up…" : "Claim admin access"}
        </Button>
        <Link
          to="/account"
          className="mt-5 inline-flex text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          Go to my customer account
        </Link>
      </div>
    </div>
  );
}
