import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, MapPin, Menu, X } from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/brand";
import { ButtonLink, Button } from "@/components/ag";
import { useAuth, signOutEverywhere } from "@/hooks/use-auth";
import { useHomeRoute } from "@/hooks/use-home-route";
import { useLocationArea } from "@/hooks/use-location";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/ongoing-care", label: "Ongoing Care" },
  { to: "/about", label: "About" },
] as const;

function LocationSelect({ className = "" }: { className?: string }) {
  const { stateCode, setStateCode, areas } = useLocationArea();
  return (
    <div className={`relative ${className}`}>
      <MapPin
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary"
        strokeWidth={1.25}
      />
      <select
        aria-label="Service area"
        value={stateCode}
        onChange={(e) => setStateCode(e.target.value)}
        className="h-11 w-full appearance-none rounded-lg border border-border bg-paper pl-10 pr-9 text-sm font-medium text-foreground focus:border-primary focus:outline-none"
      >
        {areas.length === 0 ? <option value={stateCode}>Michigan</option> : null}
        {areas.map((a) => (
          <option key={a.id} value={a.state_code}>
            {a.name}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        strokeWidth={1.25}
      />
    </div>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { data: home } = useHomeRoute();
  const homeTo = home ?? "/account";
  const homeLabel = home === "/admin" ? "Dashboard" : home === "/provider" ? "Provider Dashboard" : "My Home";
  const navigate = useNavigate();

  const signOut = async () => {
    await signOutEverywhere();
    navigate({ to: "/", replace: true });
  };

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-5 lg:grid-cols-[auto_1fr_auto] lg:px-10">
        <Logo />

        <nav className="hidden items-center justify-center gap-9 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "border-foreground text-foreground" }}
              inactiveProps={{ className: "border-transparent text-foreground/70" }}
              className="border-b-2 pb-1 text-sm font-semibold transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LocationSelect className="w-[190px]" />
          {user ? (
            <>
              <ButtonLink to={homeTo} variant="outline">
                {homeLabel}
              </ButtonLink>
              <Button variant="quiet" size="sm" onClick={signOut}>
                Sign out
              </Button>
            </>
          ) : (
            <ButtonLink to="/login" variant="outline">
              Sign in
            </ButtonLink>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="justify-self-end rounded-lg border border-border p-2.5 lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-5 w-5" strokeWidth={1.25} /> : <Menu className="h-5 w-5" strokeWidth={1.25} />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-border px-5 pb-6 pt-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-1 py-2.5 text-base font-semibold"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 space-y-3">
            <LocationSelect />
            {user ? (
              <>
                <ButtonLink to={homeTo} variant="outline" className="w-full" onClick={() => setOpen(false)}>
                  {homeLabel}
                </ButtonLink>
                <Button variant="quiet" className="w-full" onClick={signOut}>
                  Sign out
                </Button>
              </>
            ) : (
              <ButtonLink to="/login" variant="outline" className="w-full" onClick={() => setOpen(false)}>
                Sign in
              </ButtonLink>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
