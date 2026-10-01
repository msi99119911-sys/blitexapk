import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import {
  Clock3,
  Download,
  ExternalLink,
  Flame,
  Inbox,
  Package,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/** "12.4 MB" from bytes. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Big flat stat block with a number and a label. */
export function NbStat({
  value,
  label,
  className,
}: {
  value: string | number;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("nb bg-card p-4", className)}>
      <div className="nb-display text-2xl leading-none sm:text-3xl">
        {value}
      </div>
      <div className="mt-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

const statusStyles: Record<
  Doc<"apps">["status"],
  { label: string; cls: string; icon: typeof Clock3 }
> = {
  pending: {
    label: "Hidden",
    cls: "bg-primary text-foreground",
    icon: Clock3,
  },
  published: {
    label: "Live",
    cls: "bg-accent text-foreground",
    icon: ShieldCheck,
  },
};

/** Flat status chip used in the admin dashboard. */
export function NbStatusBadge({ status }: { status: Doc<"apps">["status"] }) {
  const s = statusStyles[status];
  const Icon = s.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border-2 border-border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest",
        s.cls,
      )}
    >
      <Icon className="size-3" />
      {s.label}
    </span>
  );
}

/** Empty state block. */
export function NbEmpty({
  icon: Icon = Inbox,
  title,
  hint,
}: {
  icon?: typeof Package;
  title: string;
  hint?: string;
}) {
  return (
    <div className="nb bg-card px-6 py-14 text-center">
      <div className="mx-auto flex size-12 items-center justify-center border-2 border-border bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <p className="nb-display mt-4 text-base">{title}</p>
      {hint && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

/** One catalog card. Handles both hosted files and external download links. */
export function NbAppCard({
  app,
}: {
  app: Doc<"apps"> & { previewUrls?: (string | null)[] };
}) {
  const firstPreview = app.previewUrls?.find((url): url is string => !!url);
  const getDownloadTarget = useMutation(api.apps.getDownloadTarget);
  const [busy, setBusy] = useState(false);
  const isLink = app.kind === "link";

  const handleGet = async () => {
    setBusy(true);
    try {
      const target = await getDownloadTarget({ id: app._id });
      if (target.type === "link") {
        window.open(target.url, "_blank", "noopener,noreferrer");
      } else {
        const a = document.createElement("a");
        a.href = target.url;
        if (app.fileName) a.download = app.fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error(error instanceof Error ? error.message : "Download failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="nb nb-press flex h-full flex-col bg-card p-5">
      {firstPreview && (
        <div className="-mx-5 -mt-5 mb-4 overflow-hidden border-b-2 border-border">
          <img
            src={firstPreview}
            alt={`${app.name} screenshot`}
            loading="lazy"
            className="aspect-video w-full object-cover"
          />
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center border-2 border-border",
            isLink ? "bg-primary" : "bg-secondary",
          )}
        >
          {isLink ? (
            <ExternalLink className="size-5 text-foreground" />
          ) : (
            <Package className="size-5 text-white" />
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={cn(
              "border-2 border-border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest",
              isLink ? "bg-primary text-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {isLink ? "Link" : "Direct"}
          </span>
          {app.kind === "file" && app.sizeBytes !== undefined && (
            <span className="border-2 border-border bg-muted px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              {formatBytes(app.sizeBytes)}
            </span>
          )}
        </div>
      </div>

      <h3 className="nb-display mt-4 text-lg leading-tight">{app.name}</h3>
      {app.description ? (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {app.description}
        </p>
      ) : (
        <p className="mt-2 text-sm italic text-muted-foreground/70">
          No description provided.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        <span className="flex items-center gap-1">
          <Flame className="size-3.5" />
          {app.downloads} {app.downloads === 1 ? "download" : "downloads"}
        </span>
        {app.fileName && (
          <span className="max-w-[14rem] truncate normal-case tracking-normal">
            {app.fileName}
          </span>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t-2 border-dashed border-border pt-4">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          {isLink ? "Opens link" : "Hosted file"}
        </span>
        <button
          type="button"
          onClick={handleGet}
          disabled={busy}
          className="inline-flex items-center gap-1.5 border-2 border-border bg-accent px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {isLink ? (
            <ExternalLink className="size-3.5" />
          ) : (
            <Download className="size-3.5" />
          )}
          {busy ? "…" : "Get APK"}
        </button>
      </div>
    </article>
  );
}
