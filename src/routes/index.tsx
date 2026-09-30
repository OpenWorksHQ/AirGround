import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, CircleDollarSign, House, Leaf, ShieldCheck, Snowflake } from "lucide-react";

import { AMark } from "@/components/brand";
import { ButtonLink, Eyebrow } from "@/components/ag";
import { BookingPanel } from "@/components/booking-panel";
import { ServiceIcon } from "@/components/service-icon";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useCategories } from "@/lib/catalog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AIRGROUND Home Services — Complete Home Care, All Year Long" },
      {
        name: "description",
        content:
          "Landscaping and HVAC working together for a cleaner, more comfortable home. Book once or keep it scheduled. Now serving Michigan.",
      },
      { property: "og:title", content: "AIRGROUND Home Services" },
      {
        property: "og:description",
        content: "Landscaping and HVAC on one schedule. Book once or keep it scheduled.",
      },
    ],
  }),
  component: Home,
});

const BENEFITS = [
  { icon: Leaf, label: "Cleaner\nProperty" },
  { icon: Snowflake, label: "Comfort\nYear-Round" },
  { icon: House, label: "Higher\nProperty Value" },
  { icon: ShieldCheck, label: "One Reliable\nTeam" },
];

const CARE_BENEFITS = [
  {
    icon: CalendarCheck,
    title: "Scheduled Maintenance",
    body: "Keep your home in top shape year-round.",
  },
  { icon: CircleDollarSign, title: "Save Time", body: "Less hassle, better long-term value." },
  { icon: ShieldCheck, title: "Priority Scheduling", body: "Same trusted team, faster scheduling." },
];

function Home() {
  const { data: categories } = useCategories();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute -right-10 top-0 hidden h-full w-[34%] lg:block">
          <AMark className="h-full w-full" />
        </div>

        <div className="relative mx-auto grid max-w-[1400px] gap-12 px-5 py-14 lg:grid-cols-[1fr_470px] lg:gap-16 lg:px-10 lg:py-20">
          <div className="lg:pr-6">
            <h1 className="display-xl text-[3.1rem] sm:text-[4.2rem] lg:text-[5.1rem]">
              Complete
              <br />
              Home Care.
              <br />
              <span className="text-primary">All Year Long.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-foreground/80">
              Landscaping and HVAC working together for a cleaner, more comfortable home.
            </p>

            <div className="mt-12 grid grid-cols-2 gap-y-8 border-t border-border pt-8 sm:grid-cols-4 sm:gap-0">
              {BENEFITS.map((b, i) => (
                <div key={b.label} className={i > 0 ? "sm:rule-l sm:pl-6" : ""}>
                  <b.icon className="h-8 w-8" strokeWidth={1.25} aria-hidden="true" />
                  <p className="eyebrow mt-3 whitespace-pre-line !text-foreground">{b.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:pt-2">
            <BookingPanel />
          </div>
        </div>
      </section>

      {/* SERVICES STRIP */}
      <section className="border-b border-border bg-paper">
        <div className="mx-auto max-w-[1400px] px-5 py-12 lg:px-10">
          <Eyebrow>Our Services</Eyebrow>
          <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr] lg:gap-0">
            <div className="lg:pr-10">
              <h2 className="text-[1.8rem] font-extrabold">
                Landscaping
                <br />+ HVAC
                <br />
                Built Together.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                One team. One plan. A healthier home inside and out.
              </p>
              <ButtonLink to="/services" variant="outline" size="sm" className="mt-5">
                See All Services <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </ButtonLink>
            </div>

            <div className="grid grid-cols-2 gap-y-8 sm:grid-cols-3 lg:grid-cols-6 lg:gap-0">
              {(categories ?? []).map((c) => (
                <Link
                  key={c.slug}
                  to="/services/$service"
                  params={{ service: c.slug }}
                  className="group px-0 text-center lg:rule-l lg:px-5"
                >
                  <ServiceIcon
                    name={c.icon}
                    className="mx-auto h-8 w-8 text-foreground transition-colors group-hover:text-primary"
                  />
                  <p className="mt-3 text-sm font-bold leading-tight">{c.name}</p>
                  <p className="mt-2 text-xs leading-snug text-muted-foreground">{c.blurb}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ONGOING CARE STRIP */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-[1400px] gap-8 px-5 py-12 lg:grid-cols-[300px_1fr_auto] lg:items-center lg:px-10">
          <div>
            <div className="flex items-center gap-4">
              <span className="h-px w-10 bg-primary-foreground/40" />
              <span className="eyebrow !text-primary-foreground/70">Ongoing Care</span>
            </div>
            <h2 className="mt-4 text-[1.9rem] font-extrabold">Set It and Relax.</h2>
            <p className="mt-3 text-sm text-primary-foreground/80">
              Ongoing landscaping and HVAC care, scheduled around your home.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {CARE_BENEFITS.map((b) => (
              <div key={b.title} className="rounded-xl bg-primary-foreground/10 p-4">
                <b.icon className="h-7 w-7" strokeWidth={1.25} aria-hidden="true" />
                <p className="mt-3 text-sm font-bold leading-tight">{b.title}</p>
                <p className="mt-1.5 text-xs text-primary-foreground/75">{b.body}</p>
              </div>
            ))}
          </div>

          <ButtonLink to="/book" search={{ mode: "care" }} variant="onDark" size="lg">
            Build My Home Care Plan <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
          </ButtonLink>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
