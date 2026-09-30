import { Link, type LinkProps } from "@tanstack/react-router";
import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
        outline: "border border-border-strong bg-transparent text-foreground hover:bg-secondary",
        soft: "bg-secondary text-secondary-foreground hover:bg-accent",
        onDark:
          "bg-primary-foreground text-primary hover:bg-primary-foreground/90 rounded-full px-7",
        quiet: "text-foreground hover:text-primary",
      },
      size: {
        sm: "h-9 px-3.5 text-[0.8rem]",
        md: "h-11 px-5 text-sm",
        lg: "h-14 px-6 text-[0.95rem]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}

type ButtonLinkProps = LinkProps & VariantProps<typeof buttonStyles> & { className?: string };

export function ButtonLink({ className, variant, size, ...props }: ButtonLinkProps) {
  return <Link className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}

export function Panel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card shadow-soft", className)}>
      {children}
    </div>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <span className="h-px w-10 bg-border-strong" />
      <span className="eyebrow">{children}</span>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <div className="mt-2">{children}</div>
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </label>
  );
}

export const inputStyles =
  "h-12 w-full rounded-lg border border-input bg-paper px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none";

const STATUS_LABEL: Record<string, string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function StatusChip({ status }: { status: string }) {
  const tone =
    status === "completed"
      ? "bg-secondary text-primary"
      : status === "cancelled"
        ? "bg-muted text-muted-foreground"
        : status === "in_progress" || status === "scheduled"
          ? "bg-primary text-primary-foreground"
          : "border border-border-strong text-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[0.7rem] font-semibold tracking-wide",
        tone,
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export const FREQUENCY_LABEL: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
  seasonally: "Seasonally",
  twice_yearly: "Twice per year",
  yearly: "Yearly",
  custom: "Custom",
};
