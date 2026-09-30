import { createFileRoute } from "@tanstack/react-router";

import { Eyebrow } from "@/components/ag";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useLocationArea } from "@/hooks/use-location";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — AIRGROUND Home Services" },
      {
        name: "description",
        content:
          "AirGround combines landscaping and HVAC into one household maintenance service, currently serving Michigan.",
      },
      { property: "og:title", content: "About AIRGROUND" },
      {
        property: "og:description",
        content: "One team for landscaping and HVAC, on one schedule.",
      },
    ],
  }),
  component: About,
});

function About() {
  const { areas } = useLocationArea();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-[840px] px-5 py-14 lg:px-10">
        <Eyebrow>About</Eyebrow>
        <h1 className="display-xl mt-5 text-[2.6rem] sm:text-[3.2rem]">
          One team for the outside
          <br />
          and the inside.
        </h1>
        <p className="mt-6 text-lg text-foreground/80">
          Most homes are handed off between a lawn crew and an HVAC company that never speak to each
          other. AirGround does both, on one schedule, with one account.
        </p>
        <div className="mt-10 grid gap-6 border-t border-border pt-8 sm:grid-cols-2">
          <div>
            <span className="eyebrow">Where we work</span>
            <p className="mt-2 text-sm text-muted-foreground">
              {areas.length > 0
                ? areas.map((a) => a.name).join(", ")
                : "Michigan"}
              . New service areas are added as we grow.
            </p>
          </div>
          <div>
            <span className="eyebrow">How to use us</span>
            <p className="mt-2 text-sm text-muted-foreground">
              Book a single service when you need it, or set up ongoing care and let us keep it
              scheduled.
            </p>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
