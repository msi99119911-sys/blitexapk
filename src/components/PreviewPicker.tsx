import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_PREVIEWS = 4;
const MAX_PREVIEW_BYTES = 5 * 1024 * 1024; // 5 MB per image

/** A screenshot slot: a saved storage ID or an in-progress upload. */
export type PreviewSlot = Id<"_storage"> | { file: File };

/** Uploads one image; resolves its storage ID. */
function uploadImage(
  uploadUrl: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
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
    xhr.addEventListener("error", () => reject(new Error("Network error during upload.")));
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled.")));
    xhr.send(file);
  });
}

/**
 * Screenshot picker for the admin console.
 *
 * `value` mixes two slot kinds:
 *  - Id<"_storage"> → saved screenshot (thumbnail loads from storage)
 *  - { file }       → new upload in progress (thumbnail is a local object URL)
 *
 * The parent owns the array; every add/remove/replace flows through onChange.
 */
export function PreviewPicker({
  value,
  onChange,
  label = "Screenshots",
  disabled = false,
}: {
  value: PreviewSlot[];
  onChange: (slots: PreviewSlot[]) => void;
  label?: string;
  disabled?: boolean;
}) {
  const generateUploadUrl = useMutation(api.apps.generateUploadUrl);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  // Saved screenshots resolve to display URLs in one query.
  const savedIds = useMemo(
    () => value.filter((slot): slot is Id<"_storage"> => typeof slot === "string"),
    [value],
  );
  const savedUrls = useQuery(
    api.apps.getPreviewUrls,
    savedIds.length > 0 ? { ids: savedIds } : "skip",
  );
  const urlById = useMemo(() => {
    const map: Record<string, string | null> = {};
    savedUrls?.forEach((url, i) => {
      map[savedIds[i]] = url;
    });
    return map;
  }, [savedUrls, savedIds]);

  // Local object URLs for in-progress uploads, keyed by slot index.
  const [objectUrls, setObjectUrls] = useState<Record<number, string>>({});
  useEffect(
    () => () => {
      for (const url of Object.values(objectUrls)) URL.revokeObjectURL(url);
    },
    [objectUrls],
  );

  const spotsLeft = MAX_PREVIEWS - value.length;

  const pickFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return;
    if (spotsLeft <= 0) {
      toast.error(`At most ${MAX_PREVIEWS} screenshots per app.`);
      return;
    }

    const accepted: File[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image.`);
        continue;
      }
      if (file.size > MAX_PREVIEW_BYTES) {
        toast.error(`${file.name} is larger than 5 MB.`);
        continue;
      }
      if (accepted.length >= spotsLeft) {
        toast.error(`At most ${MAX_PREVIEWS} screenshots per app.`);
        break;
      }
      accepted.push(file);
    }
    if (accepted.length === 0) return;

    // Append file-slots right away so thumbnails show while uploading.
    onChange([...value, ...accepted.map((file) => ({ file }))]);

    for (let i = 0; i < accepted.length; i++) {
      const slotIndex = value.length + i;
      setObjectUrls((prev) => ({ ...prev, [slotIndex]: URL.createObjectURL(accepted[i]) }));
      try {
        const uploadUrl = await generateUploadUrl({});
        const storageId = await uploadImage(uploadUrl, accepted[i], () => {});
        const filled = storageId as Id<"_storage">;
        onChange([
          ...value.slice(0, slotIndex),
          filled,
          ...value.slice(slotIndex + 1),
        ]);
      } catch (error) {
        console.error("Preview upload error:", error);
        toast.error(error instanceof Error ? error.message : "Screenshot upload failed.");
        onChange([
          ...value.slice(0, slotIndex),
          ...value.slice(slotIndex + 1),
        ]);
      }
    }
  };

  return (
    <div>
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        {value.map((slot, index) => {
          const displayUrl =
            typeof slot === "string" ? urlById[slot] : objectUrls[index];
          const uploading = typeof slot !== "string";
          return (
            <div
              key={index}
              className={cn(
                "relative h-20 w-16 shrink-0 border-2 border-border bg-muted",
                uploading && "animate-pulse",
              )}
            >
              {displayUrl ? (
                <img src={displayUrl} alt="" className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  {uploading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ImagePlus className="size-4" />
                  )}
                </div>
              )}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                  className="absolute -right-2 -top-2 flex size-5 items-center justify-center border-2 border-border bg-destructive text-white"
                  aria-label="Remove screenshot"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          );
        })}

        {spotsLeft > 0 && !disabled && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void pickFiles(e.dataTransfer.files);
            }}
            className={cn(
              "flex h-20 w-28 shrink-0 flex-col items-center justify-center gap-1 border-2 border-dashed border-border bg-background text-center transition-colors",
              dragging ? "bg-primary/20" : "hover:bg-muted",
            )}
          >
            <ImagePlus className="size-4" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest">
              Add ({spotsLeft} left)
            </span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            void pickFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">
        Up to {MAX_PREVIEWS} images, 5 MB each. Shown on the app's catalog card.
      </p>
    </div>
  );
}
