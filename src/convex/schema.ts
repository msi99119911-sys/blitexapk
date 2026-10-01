import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. Only admins exist now: the public browses and
// downloads, admins upload and manage the catalog.
export const ROLES = {
  ADMIN: "admin",
} as const;

export const roleValidator = v.literal(ROLES.ADMIN);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // APK catalog entries. Two kinds:
    //  - "file": the APK binary is stored in Convex storage.
    //  - "link": the download button opens an external URL (e.g. MediaFire).
    // Both are created by admins and appear publicly once published.
    apps: defineTable({
      name: v.string(),
      description: v.optional(v.string()),
      uploaderId: v.id("users"),
      // "file" | "link"
      kind: v.union(v.literal("file"), v.literal("link")),
      // present when kind === "file"
      storageId: v.optional(v.id("_storage")),
      fileName: v.optional(v.string()),
      sizeBytes: v.optional(v.number()),
      // present when kind === "link"
      downloadUrl: v.optional(v.string()),
      // "pending" | "published"
      status: v.union(v.literal("pending"), v.literal("published")),
      downloads: v.number(),
      // Optional preview screenshots (max 4) shown on catalog cards.
      previewStorageIds: v.optional(v.array(v.id("_storage"))),
    })
      .index("by_status", ["status"])
      .index("by_uploader", ["uploaderId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
