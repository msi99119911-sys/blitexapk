import { NbNav } from "@/components/nb";
import { NbAppCard, NbStat } from "@/components/nb-widgets";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { LayoutGrid, ShieldCheck, Zap } from "lucide-react";
import { Link } from "react-router";
const tickerItems = [
  "Checked & virus-free APKs",
  "Fresh links updated daily",
  "No sign-up to download",
  "Works on every phone",
  "Direct & mirror links",
  "Built for speed",
];

const steps = [
  {
    n: "01",
    title: "Search the catalog",
    body: "Browse a curated collection of useful APKs, sorted by newest or most downloaded. Every listing is added by hand — nothing random, nothing shady.",
  },
  {
    n: "02",
    title: "Tap to download",
    body: "Hosted files download straight from the hub; mirror links open in a new tab. No account, no waiting rooms, no pop-up mazes.",
  },
  {
    n: "03",
    title: "Come back tomorrow",
    body: "The catalog grows daily with fresh versions and new apps, so your favourite builds are always up to date.",
  },
];

export default function Landing() {
  const apps = useQuery(api.apps.listPublished) ?? [];
  const stats = useQuery(api.apps.publicStats);
  const latest = apps.slice(0, 6);

  return (
    <div className="min-h-screen bg-background nb-grid-bg">
      <NbNav />

      {/* Marquee ticker */}
      <div className="overflow-hidden border-b-2 border-border bg-foreground py-2 text-background">
        <motion.div
          className="flex w-max gap-10 whitespace-nowrap will-change-transform"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 28, ease: "linear", repeat: Infinity }}
        >
          {[0, 1].map((copy) => (
            <div key={copy} className="flex gap-10" aria-hidden={copy === 1}>
              {tickerItems.map((item) => (
                <span
                  key={`${copy}-${item}`}
                  className="text-xs font-extrabold uppercase tracking-[0.2em]"
                >
                  {item} <span className="text-primary">✦</span>
                </span>
              ))}
            </div>
          ))}
        </motion.div>
      </div>

      <main>
        {/* Hero */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-14 sm:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 border-2 border-border bg-card px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest"
              >
                <span className="size-2 bg-accent" />
                Safe APKs, updated daily
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08 }}
                className="nb-display mt-5 text-4xl leading-[1.02] sm:text-6xl"
              >
                <span className="bg-secondary px-1 text-white">Blitex</span>{" "}
                APKs
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.16 }}
                className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground"
              >
                A hand-checked collection of useful, virus-free Android apps.
                Search the catalog, tap once, and the download starts — fast on
                any phone, no account required.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.24 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                <Link
                  to="/apps"
                  className="nb nb-press inline-flex items-center gap-2 bg-primary px-6 py-3 text-sm font-extrabold uppercase tracking-wide"
                >
                  <LayoutGrid className="size-4" />
                  Browse the catalog
                </Link>
                <a
                  href="#why-safe"
                  className="nb nb-press inline-flex items-center gap-2 bg-card px-6 py-3 text-sm font-extrabold uppercase tracking-wide"
                >
                  <ShieldCheck className="size-4" />
                  Why it's safe
                </a>
              </motion.div>

              <div className="mt-10 grid max-w-md grid-cols-3 gap-3">
                <NbStat value={stats?.apps ?? "…"} label="Apps live" />
                <NbStat value={stats?.downloads ?? "…"} label="Downloads" />
                <NbStat value="Daily" label="Updates" />
              </div>
            </div>

            {/* Hero visual stack */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative mx-auto hidden w-full max-w-sm lg:block"
            >
              <div className="nb-lg rotate-2 bg-secondary p-5 text-white">
                <div className="nb-display text-5xl leading-none">APK</div>
                <div className="mt-1 text-xs font-bold uppercase tracking-widest opacity-80">
                  checked before posting
                </div>
              </div>
              <div className="nb -mt-2 -rotate-2 bg-accent p-5">
                <div className="flex items-center gap-2">
                  <Zap className="size-5" />
                  <div className="nb-display text-2xl leading-none">
                    One-tap downloads
                  </div>
                </div>
                <div className="mt-1 text-xs font-bold uppercase tracking-widest">
                  Direct files · mirror links
                </div>
              </div>
              <div className="nb mt-3 bg-card p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4" />
                  <span className="text-xs font-extrabold uppercase tracking-widest">
                    Every app reviewed
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="h-8 border-2 border-border bg-primary" />
                  <div className="h-8 border-2 border-border bg-muted" />
                  <div className="h-8 border-2 border-border bg-secondary" />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Why it's safe / how it works */}
        <section id="why-safe" className="scroll-mt-20 border-y-2 border-border bg-card">
          <div className="mx-auto w-full max-w-6xl px-4 py-14">
            <h2 className="nb-display text-2xl sm:text-3xl">How it works</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {steps.map((step) => (
                <div key={step.n} className="nb bg-background p-5">
                  <div className="inline-flex border-2 border-border bg-foreground px-2 py-1 text-background">
                    <span className="nb-display text-lg leading-none">
                      {step.n}
                    </span>
                  </div>
                  <h3 className="nb-display mt-4 text-lg">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Latest apps */}
        <section className="mx-auto w-full max-w-6xl px-4 py-14">
          <div className="flex items-end justify-between gap-4">
            <h2 className="nb-display text-2xl sm:text-3xl">Latest apps</h2>
            <Link
              to="/apps"
              className="inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-widest underline decoration-2 underline-offset-4 hover:text-secondary"
            >
              View all
            </Link>
          </div>

          {apps.length === 0 ? (
            <div className="nb mt-6 bg-card p-10 text-center">
              <p className="nb-display text-lg">The catalog is warming up</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Fresh APKs are being added — check back shortly.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((app) => (
                <NbAppCard key={app._id} app={app} />
              ))}
            </div>
          )}
        </section>

        {/* Final CTA */}
        <section className="border-t-2 border-border bg-secondary">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-14 text-center text-white">
            <h2 className="nb-display text-3xl sm:text-4xl">
              Grab your next app in one tap
            </h2>
            <p className="mt-3 max-w-lg text-sm font-medium opacity-90">
              Blitex keeps the catalog fresh, safe, and quick on every device.
            </p>
            <Link
              to="/apps"
              className="nb nb-press mt-8 inline-flex items-center gap-2 bg-primary px-7 py-3 text-sm font-extrabold uppercase tracking-wide text-foreground"
            >
              <Zap className="size-4" />
              Start downloading
            </Link>
          </div>
        </section>

        <footer className="border-t-2 border-border bg-card">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs font-bold uppercase tracking-widest text-muted-foreground sm:flex-row">
            <span>Blitex APKs</span>
            <span>Checked daily · always free</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
