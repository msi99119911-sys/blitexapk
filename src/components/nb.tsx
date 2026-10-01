import { cn } from "@/lib/utils";
import { Link } from "react-router";
import { LayoutGrid } from "lucide-react";

const linkCls =
  "border-2 border-border bg-card px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide transition-colors hover:bg-muted";

/** Square "B" block logo with a bolt chip. */
export function NbLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-10 items-center justify-center border-2 border-border bg-secondary",
        className,
      )}
    >
      <span className="nb-display text-xl leading-none text-white">B</span>
      <span className="absolute -bottom-1.5 -right-1.5 inline-flex size-4 items-center justify-center border-2 border-border bg-primary">
        <svg
          viewBox="0 0 24 24"
          className="size-3"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" />
        </svg>
      </span>
    </span>
  );
}

/**
 * Public site navbar. Deliberately carries no admin links, no sign-in
 * button, and no dashboard entry point — the public site is for browsing
 * and downloading only.
 */
export function NbNav() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-border bg-card">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <NbLogo />
          <span className="nb-display text-sm leading-none sm:text-xl">
            BLITEX <span className="text-secondary">APKs</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/" className={linkCls}>
            Home
          </Link>
          <Link
            to="/apps"
            className="border-2 border-border bg-primary px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide transition-transform hover:-translate-y-0.5"
          >
            <span className="flex items-center gap-1.5">
              <LayoutGrid className="size-3.5" />
              <span className="hidden sm:inline">Apps</span>
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
