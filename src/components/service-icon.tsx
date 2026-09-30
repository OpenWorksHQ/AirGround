import {
  CalendarDays,
  Fan,
  House,
  Leaf,
  ShieldCheck,
  Snowflake,
  Sprout,
  Waves,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  leaf: Leaf,
  sprout: Sprout,
  fan: Fan,
  waves: Waves,
  calendar: CalendarDays,
  home: House,
  snowflake: Snowflake,
  shield: ShieldCheck,
};

/** Thin line icon, single visual language across the whole product. */
export function ServiceIcon({
  name,
  className = "h-7 w-7",
}: {
  name: string | null | undefined;
  className?: string;
}) {
  const Icon = ICONS[name ?? "leaf"] ?? Leaf;
  return <Icon className={className} strokeWidth={1.25} aria-hidden="true" />;
}

export const iconForCategory = (slug: string) =>
  ({
    "lawn-landscaping": "leaf",
    "property-maintenance": "sprout",
    "heating-cooling": "fan",
    "indoor-air-quality": "waves",
    "seasonal-services": "calendar",
    "full-home-care": "home",
  })[slug] ?? "leaf";
