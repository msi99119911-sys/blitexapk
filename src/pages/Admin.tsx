import { RequireAuth } from "@/components/RequireAuth";
import { NbLogo } from "@/components/nb";
import { NbStat, NbStatusBadge, formatBytes } from "@/components/nb-widgets";
import { PreviewPicker, type PreviewSlot } from "@/components/PreviewPicker";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import {
  CheckCircle2,
  Clock3,
  CloudUpload,
  Eye,
  EyeOff,
  FilePlus2,
  KeyRound,
  Link2,
  Loader2,
  PackageSearch,
  Pencil,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type UploadTab = "file" | "link";

const MAX_NAME = 80;
const MAX_DESC = 600;
const MAX_URL = 500;

/** One editable row in the catalog manager. */
function AppRow({ app }: { app: Doc<"apps"> }) {
  const updateApp = useMutation(api.apps.updateApp);
  const updateAppLink = useMutation(api.apps.updateAppLink);
  const setAppPreviews = useMutation(api.apps.setAppPreviews);
  const publishApp = useMutation(api.apps.publishApp);
  const unpublishApp = useMutation(api.apps.unpublishApp);
  const deleteApp = useMutation(api.apps.deleteApp);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(app.name);
  const [description, setDescription] = useState(app.description ?? "");
  const [link, setLink] = useState(app.downloadUrl ?? "");
  const [previews, setPreviews] = useState<PreviewSlot[]>(
    app.previewStorageIds ?? [],
  );
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<unknown>, done: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(done);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const saveEdits = () =>
    run(async () => {
      if (previews.some((slot) => typeof slot !== "string")) {
        throw new Error("Some screenshots are still uploading.");
      }
      await updateApp({
        id: app._id,
        name: name.trim(),
        description: description.trim() || undefined,
      });
      if (app.kind === "link" && link.trim() && link.trim() !== app.downloadUrl) {
        await updateAppLink({ id: app._id, downloadUrl: link.trim() });
      }
      const savedIds = previews as Id<"_storage">[];
      const current = app.previewStorageIds ?? [];
      if (
        savedIds.length !== current.length ||
        savedIds.some((id, i) => id !== current[i])
      ) {
        await setAppPreviews({ id: app._id, previewStorageIds: savedIds });
      }
      setEditing(false);
    }, "Saved.");

  return (
    <div className="px-4 py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start">
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="grid gap-3">
              <div>
                <label
                  htmlFor={`name-${app._id}`}
                  className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground"
                >
                  App name
                </label>
                <input
                  id={`name-${app._id}`}
                  value={name}
                  maxLength={MAX_NAME}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 h-9 w-full border-2 border-border bg-background px-2 text-sm outline-none focus:bg-primary/10"
                />
              </div>
              <div>
                <label
                  htmlFor={`desc-${app._id}`}
                  className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground"
                >
                  Description
                </label>
                <textarea
                  id={`desc-${app._id}`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={MAX_DESC}
                  rows={2}
                  className="mt-1 w-full border-2 border-border bg-background px-2 py-1.5 text-sm outline-none focus:bg-primary/10"
                />
              </div>
              {app.kind === "link" && (
                <div>
                  <label
                    htmlFor={`link-${app._id}`}
                    className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground"
                  >
                    Download link
                  </label>
                  <input
                    id={`link-${app._id}`}
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://www.mediafire.com/…"
                    className="mt-1 h-9 w-full border-2 border-border bg-background px-2 text-sm outline-none focus:bg-primary/10"
                  />
                </div>
              )}
              <PreviewPicker value={previews} onChange={setPreviews} label="Screenshots" />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveEdits}
                  disabled={busy}
                  className="border-2 border-border bg-accent px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide disabled:opacity-60"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setName(app.name);
                    setDescription(app.description ?? "");
                    setLink(app.downloadUrl ?? "");
                    setPreviews(app.previewStorageIds ?? []);
                    setEditing(false);
                  }}
                  disabled={busy}
                  className="border-2 border-border bg-card px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide hover:bg-muted"
                >
                  <span className="flex items-center gap-1">
                    <X className="size-3" /> Cancel
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="nb-display text-sm">{app.name}</span>
                <NbStatusBadge status={app.status} />
                <span
                  className={cn(
                    "border-2 border-border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest",
                    app.kind === "link"
                      ? "bg-primary text-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {app.kind === "link" ? "Link" : "Direct file"}
                </span>
              </div>
              <div className="mt-1 truncate text-xs text-muted-foreground">
                {app.kind === "file"
                  ? `${app.fileName ?? "app.apk"} · ${formatBytes(app.sizeBytes ?? 0)}`
                  : app.downloadUrl}
                {" · "}
                {app.downloads} {app.downloads === 1 ? "download" : "downloads"}
              </div>
              {app.description && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {app.description}
                </p>
              )}
            </>
          )}
        </div>

        {!editing && (
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 border-2 border-border bg-card px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide hover:bg-muted disabled:opacity-60"
            >
              <Pencil className="size-3.5" />
              Edit
            </button>
            {app.status === "published" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => unpublishApp({ id: app._id }), "Hidden from the catalog.")}
                className="inline-flex items-center gap-1.5 border-2 border-border bg-primary px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                <EyeOff className="size-3.5" />
                Hide
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => publishApp({ id: app._id }), "App is live.")}
                className="inline-flex items-center gap-1.5 border-2 border-border bg-accent px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                <Eye className="size-3.5" />
                Publish
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    `Delete "${app.name}" permanently? This cannot be undone.`,
                  )
                ) {
                  run(() => deleteApp({ id: app._id }), "Deleted.");
                }
              }}
              className="inline-flex items-center gap-1.5 border-2 border-border bg-destructive px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              <Trash2 className="size-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Dedicated admin console header. Visually and functionally separate from
 * the public site: dark, its own logo lockup, and no links into the public
 * pages — this is a back-office screen, not part of the customer site.
 */
function AdminHeader() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b-2 border-border bg-foreground text-background">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-3">
        <span className="flex items-center gap-3">
          <NbLogo />
          <span className="nb-display text-sm leading-none sm:text-lg">
            BLITEX APKs <span className="text-primary">· CONTROL</span>
          </span>
        </span>
        <button
          type="button"
          onClick={async () => {
            try {
              await signOut();
              navigate("/admin");
            } catch (error) {
              console.error("Sign out error:", error);
            }
          }}
          className="border-2 border-background px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide transition-colors hover:bg-background hover:text-foreground"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}

export default function Admin() {
  const isAdmin = useQuery(api.apps.isCurrentUserAdmin);
  const hasAdmin = useQuery(api.apps.hasAnyAdmin);
  const allApps = useQuery(api.apps.listAll);
  const stats = useQuery(api.apps.stats);

  const generateUploadUrl = useMutation(api.apps.generateUploadUrl);
  const submitFileApp = useMutation(api.apps.submitFileApp);
  const submitLinkApp = useMutation(api.apps.submitLinkApp);
  const claimAdmin = useMutation(api.apps.claimAdmin);

  const [tab, setTab] = useState<UploadTab>("file");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [newPreviews, setNewPreviews] = useState<PreviewSlot[]>([]);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"idle" | "uploading" | "saving">("idle");
  const [filter, setFilter] = useState<"all" | "published" | "pending">("all");
  const [claiming, setClaiming] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      await claimAdmin({});
      toast.success("You are now the site admin.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not claim admin.");
    } finally {
      setClaiming(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setLinkUrl("");
    setFile(null);
    setNewPreviews([]);
    setProgress(0);
    setPhase("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileUpload = async () => {
    if (!file) {
      toast.error("Choose an .apk file first.");
      return;
    }
    if (!name.trim()) {
      toast.error("Give the app a name.");
      return;
    }
    if (!/\.apk$/i.test(file.name)) {
      toast.error("Only .apk files are allowed.");
      return;
    }
    if (file.size === 0) {
      toast.error("That file is empty.");
      return;
    }

    setPhase("uploading");
    setProgress(0);
    try {
      const uploadUrl = await generateUploadUrl({});
      const storageId = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", uploadUrl);
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText).storageId as string);
            } catch {
              reject(new Error("Could not read the upload result."));
            }
          } else {
            reject(new Error(`Upload failed (HTTP ${xhr.status}).`));
          }
        });
        xhr.addEventListener("error", () =>
          reject(new Error("Network error during upload.")),
        );
        xhr.addEventListener("abort", () => reject(new Error("Upload cancelled.")));
        xhr.send(file);
      });

      if (newPreviews.some((slot) => typeof slot !== "string")) {
        setPhase("idle");
        throw new Error("Some screenshots are still uploading.");
      }

      setPhase("saving");
      await submitFileApp({
        name: name.trim(),
        description: description.trim() || undefined,
        storageId: storageId as unknown as Id<"_storage">,
        fileName: file.name,
        sizeBytes: file.size,
        previewStorageIds: newPreviews.length
          ? (newPreviews as Id<"_storage">[])
          : undefined,
      });
      toast.success("APK uploaded and live in the catalog.");
      resetForm();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Upload failed.");
      setPhase("idle");
    }
  };

  const handleLinkSubmit = async () => {
    if (!name.trim()) {
      toast.error("Give the app a name.");
      return;
    }
    if (!/^https?:\/\/\S+$/i.test(linkUrl.trim())) {
      toast.error("Enter a valid link starting with http:// or https://");
      return;
    }
    if (newPreviews.some((slot) => typeof slot !== "string")) {
      toast.error("Some screenshots are still uploading.");
      return;
    }
    try {
      await submitLinkApp({
        name: name.trim(),
        description: description.trim() || undefined,
        downloadUrl: linkUrl.trim(),
        previewStorageIds: newPreviews.length
          ? (newPreviews as Id<"_storage">[])
          : undefined,
      });
      toast.success("Link app added and live in the catalog.");
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add the link.");
    }
  };

  if (isAdmin === undefined || hasAdmin === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background nb-grid-bg">
        <AdminHeader />
        <main className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-20 text-center">
          <div className="nb bg-card p-8">
            <div className="mx-auto flex size-12 items-center justify-center border-2 border-border bg-primary">
              <KeyRound className="size-5" />
            </div>
            {hasAdmin ? (
              <>
                <h1 className="nb-display mt-4 text-xl">Admin only</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  An admin account already exists and this isn't it. Sign in
                  with the admin email to manage the catalog.
                </p>
              </>
            ) : (
              <>
                <h1 className="nb-display mt-4 text-xl">Claim this site</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  No admin exists yet. The first account to claim becomes the
                  site admin and controls the whole catalog.
                </p>
                <button
                  type="button"
                  onClick={handleClaim}
                  disabled={claiming}
                  className="nb nb-press mt-6 inline-flex w-full items-center justify-center gap-2 bg-secondary px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-white disabled:opacity-60"
                >
                  {claiming ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Claiming…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-4" />
                      Become the admin
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </main>
      </div>
    );
  }

  const visible = (allApps ?? []).filter(
    (app) => filter === "all" || app.status === filter,
  );

  return (
    <RequireAuth redirectImmediately>
      <div className="min-h-screen bg-background nb-grid-bg">
        <AdminHeader />

        <main className="mx-auto w-full max-w-6xl px-4 py-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="nb-display text-3xl sm:text-4xl">Dashboard</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Add APKs, update them any time, and everything goes live
                instantly for your customers.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 border-2 border-border bg-accent px-3 py-1.5 text-xs font-extrabold uppercase tracking-widest">
              <ShieldCheck className="size-3.5" />
              Admin
            </span>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <NbStat value={stats?.published ?? "…"} label="Live apps" className="bg-accent" />
            <NbStat value={stats?.pending ?? "…"} label="Hidden" className="bg-primary" />
            <NbStat value={stats?.totalDownloads ?? "…"} label="Downloads" />
            <NbStat value={stats ? formatBytes(stats.totalBytes) : "…"} label="Hosted size" />
          </div>

          {/* Add app */}
          <section className="nb mt-8 bg-card p-5">
            <h2 className="nb-display text-lg">Add an app</h2>
            <div className="mt-4 flex gap-2">
              {(
                [
                  { key: "file", label: "Upload .apk file", icon: FilePlus2 },
                  { key: "link", label: "Use a download link", icon: Link2 },
                ] as const
              ).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setTab(key);
                    resetForm();
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 border-2 border-border px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide",
                    tab === key
                      ? "bg-foreground text-background"
                      : "bg-card hover:bg-muted",
                  )}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {tab === "file" ? (
              <div className="mt-5 grid gap-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const dropped = e.dataTransfer.files?.[0];
                    if (dropped) {
                      setFile(dropped);
                      if (!name.trim()) {
                        const base = dropped.name.replace(/\.apk$/i, "");
                        if (base.length <= MAX_NAME) setName(base);
                      }
                    }
                  }}
                  className="flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-border bg-background px-6 py-8 text-center transition-colors hover:bg-muted"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".apk,application/vnd.android.package-archive"
                    className="hidden"
                    onChange={(e) => {
                      const picked = e.target.files?.[0] ?? null;
                      setFile(picked);
                      if (picked && !name.trim()) {
                        const base = picked.name.replace(/\.apk$/i, "");
                        if (base.length <= MAX_NAME) setName(base);
                      }
                    }}
                  />
                  <div className="flex size-11 items-center justify-center border-2 border-border bg-primary">
                    <CloudUpload className="size-5" />
                  </div>
                  <p className="nb-display mt-3 text-sm">
                    {file ? file.name : "Drag & drop or click to choose an .apk"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {file ? formatBytes(file.size) : "Stored free on the hub"}
                  </p>
                </div>

                {phase === "uploading" && (
                  <div>
                    <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-widest">
                      <span>Uploading…</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="mt-1.5 h-4 border-2 border-border bg-background">
                      <div
                        className="h-full bg-secondary transition-[width] duration-150"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
                {phase === "saving" && (
                  <p className="flex items-center gap-2 text-sm font-bold">
                    <Loader2 className="size-4 animate-spin" />
                    Saving listing…
                  </p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="admin-name" className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                      App name
                    </label>
                    <input
                      id="admin-name"
                      value={name}
                      maxLength={MAX_NAME}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Blitex Notes"
                      className="mt-1 h-10 w-full border-2 border-border bg-background px-3 text-sm outline-none focus:bg-primary/10"
                    />
                  </div>
                  <div>
                    <label htmlFor="admin-desc" className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                      Description (optional)
                    </label>
                    <textarea
                      id="admin-desc"
                      value={description}
                      maxLength={MAX_DESC}
                      rows={2}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What the app does, version notes, supported devices…"
                      className="mt-1 w-full border-2 border-border bg-background px-3 py-2 text-sm outline-none focus:bg-primary/10"
                    />
                  </div>
                </div>

                <PreviewPicker
                  value={newPreviews}
                  onChange={setNewPreviews}
                  label="App screenshots"
                />

                <button
                  type="button"
                  onClick={handleFileUpload}
                  disabled={phase !== "idle"}
                  className="nb nb-press inline-flex w-full items-center justify-center gap-2 bg-primary px-6 py-3 text-sm font-extrabold uppercase tracking-wide disabled:opacity-60"
                >
                  {phase === "idle" ? (
                    <>
                      <CloudUpload className="size-4" />
                      Upload & publish
                    </>
                  ) : (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {phase === "uploading" ? `${progress}%` : "Saving…"}
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="mt-5 grid gap-4">
                <div>
                  <label htmlFor="admin-link-name" className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                    App name
                  </label>
                  <input
                    id="admin-link-name"
                    value={name}
                    maxLength={MAX_NAME}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Blitex Player"
                    className="mt-1 h-10 w-full border-2 border-border bg-background px-3 text-sm outline-none focus:bg-primary/10"
                  />
                </div>
                <div>
                  <label htmlFor="admin-link-url" className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                    Download link (MediaFire, Drive, …)
                  </label>
                  <input
                    id="admin-link-url"
                    value={linkUrl}
                    maxLength={MAX_URL}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://www.mediafire.com/file/…"
                    className="mt-1 h-10 w-full border-2 border-border bg-background px-3 text-sm outline-none focus:bg-primary/10"
                  />
                </div>
                <div>
                  <label htmlFor="admin-link-desc" className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                    Description (optional)
                  </label>
                  <textarea
                    id="admin-link-desc"
                    value={description}
                    maxLength={MAX_DESC}
                    rows={2}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short summary customers will see on the card."
                    className="mt-1 w-full border-2 border-border bg-background px-3 py-2 text-sm outline-none focus:bg-primary/10"
                  />
                </div>
                <PreviewPicker
                  value={newPreviews}
                  onChange={setNewPreviews}
                  label="App screenshots"
                />
                <button
                  type="button"
                  onClick={handleLinkSubmit}
                  className="nb nb-press inline-flex w-full items-center justify-center gap-2 bg-secondary px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-white"
                >
                  <Link2 className="size-4" />
                  Add link app
                </button>
              </div>
            )}
          </section>

          {/* Catalog manager */}
          <section className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="nb-display text-xl">Manage catalog</h2>
              <div className="flex gap-2">
                {(["all", "published", "pending"] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    className={cn(
                      "border-2 border-border px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide",
                      filter === key
                        ? "bg-foreground text-background"
                        : "bg-card hover:bg-muted",
                    )}
                  >
                    {key === "all" ? "All" : key === "published" ? "Live" : "Hidden"}
                  </button>
                ))}
              </div>
            </div>

            <div className="nb mt-4 bg-card">
              {allApps === undefined ? (
                <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading…
                </div>
              ) : visible.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <div className="mx-auto flex size-12 items-center justify-center border-2 border-border bg-muted">
                    <PackageSearch className="size-5 text-muted-foreground" />
                  </div>
                  <p className="nb-display mt-4 text-base">
                    {filter === "all" ? "No apps yet" : `No ${filter === "published" ? "live" : "hidden"} apps`}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add your first APK with the form above.
                  </p>
                </div>
              ) : (
                <div className="divide-y-2 divide-border">
                  {visible.map((app) => (
                    <AppRow key={app._id} app={app} />
                  ))}
                </div>
              )}
            </div>
          </section>

          <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="size-3.5" />
            Hidden apps stay in the catalog manager but are invisible to
            customers until you publish them again.
          </p>
        </main>
      </div>
    </RequireAuth>
  );
}
