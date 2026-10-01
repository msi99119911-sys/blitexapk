import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

const APP_NAME_MAX = 80;
const APP_DESC_MAX = 600;
const FILE_NAME_RE = /\.apk$/i;
const HTTP_URL_RE = /^https?:\/\/\S+$/i;

/** Throws unless the caller is the signed-in site admin. */
async function requireAdmin(ctx: MutationCtx | QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Sign in as the site admin.");
  const user = await ctx.db.get(userId);
  if (user?.role !== "admin") throw new Error("Admins only.");
  return userId;
}

/** Upload URL used by the admin's browser to PUT an .apk into storage. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Save a file-based app after the APK was PUT to storage. Admin-only.
 * New uploads start as "published" so they go live immediately; pass
 * startPending to hold them for review instead.
 */
export const submitFileApp = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    storageId: v.id("_storage"),
    fileName: v.string(),
    sizeBytes: v.number(),
    previewStorageIds: v.optional(v.array(v.id("_storage"))),
    startPending: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAdmin(ctx);

    const name = args.name.trim();
    if (name.length === 0) throw new Error("App name is required.");
    if (name.length > APP_NAME_MAX)
      throw new Error(`App name must be ${APP_NAME_MAX} characters or fewer.`);
    if (!FILE_NAME_RE.test(args.fileName))
      throw new Error("Only .apk files can be uploaded.");
    if (args.sizeBytes <= 0) throw new Error("The uploaded file is empty.");
    if (args.previewStorageIds && args.previewStorageIds.length > MAX_PREVIEWS)
      throw new Error(`At most ${MAX_PREVIEWS} screenshots per app.`);

    const description = (args.description ?? "").trim();
    if (description.length > APP_DESC_MAX)
      throw new Error(`Description must be ${APP_DESC_MAX} characters or fewer.`);

    const metadata = await ctx.db.system.get(args.storageId);
    if (!metadata) throw new Error("Upload not found. Please try again.");
    if (metadata.size !== args.sizeBytes)
      throw new Error("Upload did not complete. Please try again.");

    return await ctx.db.insert("apps", {
      name,
      description: description.length > 0 ? description : undefined,
      uploaderId: userId,
      kind: "file",
      storageId: args.storageId,
      fileName: args.fileName,
      sizeBytes: args.sizeBytes,
      status: args.startPending ? "pending" : "published",
      downloads: 0,
      previewStorageIds:
        args.previewStorageIds && args.previewStorageIds.length > 0
          ? args.previewStorageIds
          : undefined,
    });
  },
});

/** Save a link-based app (e.g. a MediaFire page). Admin-only. */
export const submitLinkApp = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    downloadUrl: v.string(),
    fileName: v.optional(v.string()),
    sizeBytes: v.optional(v.number()),
    previewStorageIds: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    const userId = await requireAdmin(ctx);

    const name = args.name.trim();
    if (name.length === 0) throw new Error("App name is required.");
    if (name.length > APP_NAME_MAX)
      throw new Error(`App name must be ${APP_NAME_MAX} characters or fewer.`);

    const url = args.downloadUrl.trim();
    if (!HTTP_URL_RE.test(url))
      throw new Error("Enter a valid link starting with http:// or https://");

    const description = (args.description ?? "").trim();
    if (description.length > APP_DESC_MAX)
      throw new Error(`Description must be ${APP_DESC_MAX} characters or fewer.`);

    const fileName = (args.fileName ?? "").trim();
    if (fileName.length > 120)
      throw new Error("File name must be 120 characters or fewer.");

    return await ctx.db.insert("apps", {
      name,
      description: description.length > 0 ? description : undefined,
      uploaderId: userId,
      kind: "link",
      downloadUrl: url,
      fileName: fileName.length > 0 ? fileName : undefined,
      status: "published",
      downloads: 0,
      previewStorageIds:
        args.previewStorageIds && args.previewStorageIds.length > 0
          ? args.previewStorageIds
          : undefined,
    });
  },
});

/** Maximum preview screenshots per app. */
const MAX_PREVIEWS = 4;

/**
 * Attach up to 4 preview screenshots to an app. Admin-only.
 * Expects storage IDs from uploads the admin's browser already completed.
 */
export const setAppPreviews = mutation({
  args: {
    id: v.id("apps"),
    previewStorageIds: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.previewStorageIds.length > MAX_PREVIEWS)
      throw new Error(`At most ${MAX_PREVIEWS} screenshots per app.`);
    await ctx.db.patch(args.id, {
      previewStorageIds: args.previewStorageIds,
    });
  },
});

/** Admin: rename / edit an app's public details. */
export const updateApp = mutation({
  args: {
    id: v.id("apps"),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const name = args.name.trim();
    if (name.length === 0) throw new Error("App name is required.");
    if (name.length > APP_NAME_MAX)
      throw new Error(`App name must be ${APP_NAME_MAX} characters or fewer.`);

    const description = (args.description ?? "").trim();
    if (description.length > APP_DESC_MAX)
      throw new Error(`Description must be ${APP_DESC_MAX} characters or fewer.`);

    await ctx.db.patch(args.id, {
      name,
      description: description.length > 0 ? description : undefined,
    });
  },
});

/** Admin: point a link app at a new URL. */
export const updateAppLink = mutation({
  args: { id: v.id("apps"), downloadUrl: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const url = args.downloadUrl.trim();
    if (!HTTP_URL_RE.test(url))
      throw new Error("Enter a valid link starting with http:// or https://");
    await ctx.db.patch(args.id, { downloadUrl: url });
  },
});

/** Public/admin: storage URLs for a list of preview screenshot IDs. */
export const getPreviewUrls = query({
  args: { ids: v.array(v.id("_storage")) },
  handler: async (ctx, args) =>
    await Promise.all(args.ids.map((id) => ctx.storage.getUrl(id))),
});

/** Public listing: published apps only, newest first, with preview URLs. */
export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const apps = await ctx.db
      .query("apps")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .order("desc")
      .collect();

    // Resolve preview screenshot URLs for the catalog cards.
    return await Promise.all(
      apps.map(async (app) => {
        if (!app.previewStorageIds || app.previewStorageIds.length === 0) {
          return { ...app, previewUrls: [] as (string | null)[] };
        }
        const previewUrls = await Promise.all(
          app.previewStorageIds.map((id) => ctx.storage.getUrl(id)),
        );
        return { ...app, previewUrls };
      }),
    );
  },
});

/** Public counts for the landing/browse stat blocks. */
export const publicStats = query({
  args: {},
  handler: async (ctx) => {
    const published = await ctx.db
      .query("apps")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();
    let totalDownloads = 0;
    let totalBytes = 0;
    for (const app of published) {
      totalDownloads += app.downloads;
      totalBytes += app.sizeBytes ?? 0;
    }
    return {
      apps: published.length,
      downloads: totalDownloads,
      bytes: totalBytes,
    };
  },
});

/**
 * Public: resolve a download for a published app. File apps return a storage
 * URL (the caller triggers the browser download); link apps return their
 * external URL to open in a new tab. Either way the hit is counted.
 */
export const getDownloadTarget = mutation({
  args: { id: v.id("apps") },
  handler: async (ctx, args) => {
    const app = await ctx.db.get(args.id);
    if (!app) throw new Error("App not found.");
    if (app.status !== "published")
      throw new Error("This app is not available.");

    if (app.kind === "link") {
      await ctx.db.patch(args.id, { downloads: app.downloads + 1 });
      return { type: "link" as const, url: app.downloadUrl! };
    }

    const url = await ctx.storage.getUrl(app.storageId!);
    if (!url) throw new Error("The file for this app is gone.");
    await ctx.db.patch(args.id, { downloads: app.downloads + 1 });
    return { type: "file" as const, url };
  },
});

/** One-time claim: the first user to run this becomes the site admin. */
export const claimAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in first.");

    const admins = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();
    if (admins !== null)
      throw new Error("An admin already exists for this site.");

    await ctx.db.patch(userId, { role: "admin" });
  },
});

/** Does an admin exist? Used by the client to show the claim-admin flow. */
export const hasAnyAdmin = query({
  args: {},
  handler: async (ctx) =>
    (await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first()) !== null,
});

/** Is the current signed-in user the admin? */
export const isCurrentUserAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return false;
    const user = await ctx.db.get(userId);
    return user?.role === "admin";
  },
});

/** Admin: every app regardless of status, newest first. Null for non-admins. */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    if (user?.role !== "admin") return null;
    return await ctx.db.query("apps").order("desc").collect();
  },
});

/** Admin: counts for the dashboard stats. Null for non-admins. */
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    if (user?.role !== "admin") return null;

    const all = await ctx.db.query("apps").collect();
    let pending = 0;
    let published = 0;
    let totalDownloads = 0;
    let totalBytes = 0;
    let fileApps = 0;
    let linkApps = 0;
    for (const app of all) {
      if (app.status === "pending") pending += 1;
      else published += 1;
      if (app.kind === "file") {
        fileApps += 1;
        totalBytes += app.sizeBytes ?? 0;
      } else {
        linkApps += 1;
      }
      totalDownloads += app.downloads;
    }
    return {
      pending,
      published,
      totalDownloads,
      totalBytes,
      fileApps,
      linkApps,
    };
  },
});

/** Admin: publish a pending app. */
export const publishApp = mutation({
  args: { id: v.id("apps") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.id, { status: "published" });
  },
});

/** Admin: unpublish back to pending (hides from the public catalog). */
export const unpublishApp = mutation({
  args: { id: v.id("apps") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.id, { status: "pending" });
  },
});

/** Admin: permanently delete an app record and, for file apps, its stored APK. */
export const deleteApp = mutation({
  args: { id: v.id("apps") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const app = await ctx.db.get(args.id);
    if (!app) return;
    if (app.kind === "file" && app.storageId) {
      await ctx.storage.delete(app.storageId);
    }
    await ctx.db.delete(args.id);
  },
});
