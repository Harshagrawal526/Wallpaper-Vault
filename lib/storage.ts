import { env } from "@/lib/env";
import { createSupabaseAdminClient, createSupabaseAnonClient } from "@/lib/supabase";
import { unstable_cache } from "next/cache";

type ListedItem = {
  id: string | null;
  name: string;
};

export type Wallpaper = {
  path: string;
  name: string;
  folder: string;
  fullUrl: string;
  thumbUrl: string;
};

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function normalizeFolder(folder: string): string {
  return folder.replace(/^\/+|\/+$/g, "");
}

async function listRecursive(folder = ""): Promise<string[]> {
  const admin = createSupabaseAdminClient();
  const bucket = env.bucketName;
  const cleanFolder = normalizeFolder(folder);

  const { data, error } = await admin.storage.from(bucket).list(cleanFolder, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" }
  });

  if (error) {
    throw new Error(`Failed to list storage objects: ${error.message}`);
  }

  const entries = (data ?? []) as ListedItem[];
  const files: string[] = [];

  for (const entry of entries) {
    const nextPath = cleanFolder ? `${cleanFolder}/${entry.name}` : entry.name;

    if (entry.id) {
      files.push(nextPath);
      continue;
    }

    if (entry.name === ".emptyFolderPlaceholder") {
      continue;
    }

    const nested = await listRecursive(nextPath);
    files.push(...nested);
  }

  return files;
}

function buildPublicUrls(path: string) {
  const supabase = createSupabaseAnonClient();
  const bucket = env.bucketName;
  const thumbPath = toThumbPath(path);

  const fullUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  const thumbUrl = supabase.storage.from(bucket).getPublicUrl(thumbPath).data.publicUrl;

  return { fullUrl, thumbUrl };
}

async function buildSignedUrls(path: string) {
  const supabase = createSupabaseAdminClient();
  const bucket = env.bucketName;
  const thumbPath = toThumbPath(path);

  const [{ data: full, error: fullError }, { data: thumb, error: thumbError }] = await Promise.all([
    supabase.storage.from(bucket).createSignedUrl(path, env.signedUrlExpirySeconds),
    supabase.storage.from(bucket).createSignedUrl(thumbPath, env.signedUrlExpirySeconds)
  ]);

  if (fullError || thumbError || !full?.signedUrl || !thumb?.signedUrl) {
    throw new Error("Failed to create signed URLs for private bucket");
  }

  return { fullUrl: full.signedUrl, thumbUrl: thumb.signedUrl };
}

function toThumbPath(path: string): string {
  return `thumbs/${path.replace(/\.[^.]+$/, ".webp")}`;
}

function isWallpaperPath(path: string): boolean {
  if (path.startsWith("thumbs/")) {
    return false;
  }
  const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

const listWallpapersCached = unstable_cache(
  async (): Promise<Wallpaper[]> => {
    const files = await listRecursive("");
    const imageFiles = files.filter(isWallpaperPath);

    const wallpapers = await Promise.all(
      imageFiles.map(async (path) => {
        const parts = path.split("/");
        const name = parts[parts.length - 1] ?? path;
        const folder = parts.length > 1 ? parts.slice(0, -1).join("/") : "root";
        const urls = env.bucketPublic ? buildPublicUrls(path) : await buildSignedUrls(path);
        return {
          path,
          name,
          folder,
          ...urls
        };
      })
    );

    wallpapers.sort((a, b) => a.path.localeCompare(b.path));
    return wallpapers;
  },
  ["wallpapers-list"],
  { tags: ["wallpapers"], revalidate: 60 }
);

export async function listWallpapers(): Promise<Wallpaper[]> {
  return listWallpapersCached();
}

export async function wallpaperByPath(path: string): Promise<Wallpaper | null> {
  if (!isWallpaperPath(path)) {
    return null;
  }

  const parts = path.split("/");
  const name = parts[parts.length - 1] ?? path;
  const folder = parts.length > 1 ? parts.slice(0, -1).join("/") : "root";
  const urls = env.bucketPublic ? buildPublicUrls(path) : await buildSignedUrls(path);

  return {
    path,
    name,
    folder,
    ...urls
  };
}
