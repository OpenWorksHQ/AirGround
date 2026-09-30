import { Link } from "@tanstack/react-router";

/** The AIRGROUND wordmark. Black "AIR", forest "GROUND", small tracked subtitle. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`group inline-flex flex-col leading-none ${className}`}>
      <span className="display-xl text-[1.45rem] sm:text-[1.7rem]">
        <span className="text-foreground">AIR</span>
        <span className="text-primary">GROUND</span>
        <span className="align-super text-[0.5rem] font-semibold text-muted-foreground">™</span>
      </span>
      <span className="mt-1 text-[0.5rem] font-semibold tracking-[0.42em] text-foreground/70 sm:text-[0.56rem]">
        HOME SERVICES
      </span>
    </Link>
  );
}

/**
 * The abstract AIRGROUND "A" — the only decorative graphic in the product.
 * Forest wedge with pale sweeping blades cut through it.
 */
export function AMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 400" className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <path d="M150 0 L320 400 L232 400 L150 168 L68 400 L-20 400 Z" fill="var(--color-primary)" />
      <path
        d="M-40 300 C60 296 128 258 176 196 C132 282 58 330 -40 340 Z"
        fill="var(--color-paper)"
        opacity="0.92"
      />
      <path
        d="M-40 358 C70 352 150 314 206 244 C158 338 70 386 -40 396 Z"
        fill="var(--color-paper)"
        opacity="0.75"
      />
      <path d="M150 0 L232 196 L196 196 L150 84 Z" fill="var(--color-foreground)" opacity="0.88" />
    </svg>
  );
}
