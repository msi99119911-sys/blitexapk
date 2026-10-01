import { NbLogo } from "@/components/nb";
import { motion } from "framer-motion";
import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col nb-grid-bg">
      <header className="border-b-2 border-border bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-3">
          <Link to="/" className="inline-flex items-center gap-3">
            <NbLogo />
            <span className="nb-display text-lg">BLITEX APKs</span>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="nb-lg w-full max-w-md bg-card p-10 text-center"
        >
          <div className="inline-flex border-2 border-border bg-destructive px-3 py-1 text-background">
            <span className="nb-display text-4xl leading-none">404</span>
          </div>
          <h1 className="nb-display mt-5 text-2xl">Page not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            That route doesn't exist. The app you're after is probably in the
            catalog.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
            <Link
              to="/apps"
              className="nb nb-press inline-flex items-center justify-center bg-primary px-5 py-2.5 text-xs font-extrabold uppercase tracking-wide"
            >
              Browse the catalog
            </Link>
            <Link
              to="/"
              className="nb nb-press inline-flex items-center justify-center bg-card px-5 py-2.5 text-xs font-extrabold uppercase tracking-wide"
            >
              Back home
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
