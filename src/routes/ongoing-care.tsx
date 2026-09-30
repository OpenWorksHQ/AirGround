import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { AMark } from "@/components/brand";
import { ButtonLink, Eyebrow } from "@/components/ag";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/ongoing-care")({
  head: () => ({
    meta: [
      { title: "Ongoing Care — AIRGROUND Home Services" },
      {
        name: "description",
        content:
          "Choose the services you want maintained and how often. AirGround keeps landscaping and HVAC on your schedule.",
      },
      { property: "og:title", content: "Ongoing Care — AIRGROUND" },
      {
        property: "og:description",
        content: "Set it once. AirGround keeps your home's services scheduled.",
      },
    ],
  }),
  component: OngoingCare,
});

const STEPS = [
  { n: "1", title: "Choose Services", body: "Pick the lawn, property and HVAC work you want handled." },
  { n: "2", title: "Choose Frequency", body: "Weekly, every 2 weeks, seasonally — whatever fits." },
  { n: "3", title: "We Keep Them Scheduled", body: "Visits are placed on the calendar and confirmed." },
];

const EXAMPLES = [
  { when: "Every 2 Weeks", what: "Lawn Care" },
  { when: "Spring + Fall", what: "HVAC Maintenance" },
  { when: "Every Fall", what: "Seasonal Cleanup" },
];

function OngoingCare() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute -right-16 top-0 hidden h-full w-[28%] lg:block">
          <AMark className="h-full w-full" />
        </div>
        <div className="relative mx-auto max-w-[1400px] px-5 py-14 lg:px-10">
          <Eyebrow>Ongoing Care</Eyebrow>
          <h1 className="display-xl mt-5 max-w-2xl text-[2.8rem] sm:text-[3.8rem]">
            Your Home Has a Schedule.
            <br />
            <span className="text-primary">AirGround Can Handle It.</span>
          </h1>

          <div className="mt-12 grid gap-8 sm:grid-cols-3 sm:gap-0">
            {STEPS.map((s, i) => (
              <div key={s.n} className={i > 0 ? "sm:rule-l sm:pl-8" : "sm:pr-8"}>
                <span className="display-xl text-[2.4rem] text-primary">{s.n}</span>
                <h2 className="mt-2 text-lg font-extrabold">{s.title}</h2>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>

          <ButtonLink to="/book" search={{ mode: "care" }} size="lg" className="mt-12">
            Build My Home Care Plan <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
          </ButtonLink>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-12 lg:px-10">
        <Eyebrow>What a plan looks like</Eyebrow>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {EXAMPLES.map((e) => (
            <div key={e.what} className="rounded-2xl border border-border bg-card p-6">
              <p className="eyebrow !text-primary">{e.when}</p>
              <p className="mt-2 text-xl font-extrabold">{e.what}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-xl text-sm text-muted-foreground">
          All of it lives under one plan for your address. Pause a service, change how often it
          happens, or add another any time from your account.
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}
