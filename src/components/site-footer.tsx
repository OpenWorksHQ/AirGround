import { Link } from "@tanstack/react-router";

import { Logo } from "@/components/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-5 py-9 sm:flex-row sm:items-end sm:justify-between lg:px-10">
        <div>
          <Logo />
          <p className="mt-3 text-xs text-muted-foreground">
            Landscaping and HVAC on one schedule. Currently serving Michigan.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-foreground/75">
          <Link to="/services" className="hover:text-foreground">
            Services
          </Link>
          <Link to="/ongoing-care" className="hover:text-foreground">
            Ongoing Care
          </Link>
          <Link to="/book" search={{ mode: "once" }} className="hover:text-foreground">
            Book a service
          </Link>
          <Link to="/account" className="hover:text-foreground">
            My account
          </Link>
        </nav>
      </div>
    </footer>
  );
}
