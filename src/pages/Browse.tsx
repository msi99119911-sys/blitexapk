import { NbNav } from "@/components/nb";
import {
  NbAppCard,
  NbEmpty,
  NbStat,
  formatBytes,
} from "@/components/nb-widgets";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { PackageSearch, Search } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

type SortKey = "newest" | "downloads" | "name" | "size";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "downloads", label: "Top downloads" },
  { key: "name", label: "A → Z" },
  { key: "size", label: "Largest" },
];

export default function Browse() {
  const apps = useQuery(api.apps.listPublished);
  const stats = useQuery(api.apps.publicStats);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query); // keeps typing smooth on mobile
  const [sort, setSort] = useState<SortKey>("newest");

  const visible = useMemo(() => {
    if (!apps) return [];
    const q = deferredQuery.trim().toLowerCase();
    const filtered = q
      ? apps.filter(
          (app) =>
            app.name.toLowerCase().includes(q) ||
            (app.description ?? "").toLowerCase().includes(q) ||
            (app.fileName ?? "").toLowerCase().includes(q),
        )
      : apps;
    const sorted = [...filtered];
    switch (sort) {
      case "downloads":
        sorted.sort((a, b) => b.downloads - a.downloads);
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "size":
        sorted.sort((a, b) => (b.sizeBytes ?? 0) - (a.sizeBytes ?? 0));
        break;
      default:
        break; // newest — backend already orders by creation
    }
    return sorted;
  }, [apps, deferredQuery, sort]);

  return (
    <div className="min-h-screen bg-background nb-grid-bg">
      <NbNav />

      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="nb-display text-3xl sm:text-4xl">App catalog</h1>
          <p className="text-sm text-muted-foreground">
            Every APK here is checked and posted by the Blitex team. Search
            freely — downloads never need an account.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <NbStat value={stats?.apps ?? "…"} label="Apps available" />
          <NbStat value={stats?.downloads ?? "…"} label="Total downloads" />
          <NbStat value={stats ? formatBytes(stats.bytes) : "…"} label="Hosted size" />
        </div>

        {/* Search + sort controls */}
        <div className="nb mt-8 flex flex-col gap-3 bg-card p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search apps by name or keyword…"
              className="h-11 w-full border-2 border-border bg-background pl-9 pr-3 text-base outline-none placeholder:text-muted-foreground/70 focus:bg-primary/10 sm:text-sm"
            />
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:pb-0">
            {sortOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setSort(option.key)}
                className={
                  sort === option.key
                    ? "shrink-0 border-2 border-border bg-foreground px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-background"
                    : "shrink-0 border-2 border-border bg-card px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide hover:bg-muted"
                }
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="sr-only">Sort the catalog</p>
        </div>

        {/* Results */}
        <div className="mt-6">
          {apps === undefined ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="nb h-52 animate-pulse bg-muted/60" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <NbEmpty
              icon={PackageSearch}
              title={deferredQuery ? "Nothing matches that search" : "No apps yet"}
              hint={
                deferredQuery
                  ? "Try a shorter or different keyword."
                  : "New APKs are added regularly — check back soon."
              }
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((app) => (
                <NbAppCard key={app._id} app={app} />
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t-2 border-border bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          BLITEX APKs — checked, virus-free, always free
        </div>
      </footer>
    </div>
  );
}
