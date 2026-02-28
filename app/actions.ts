"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";

import { clearAdminSession, isAdminAuthenticated, setAdminSession } from "@/lib/admin-auth";
import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase";

function sanitizeFolder(folder: string): string {
  return folder.trim().replace(/^\/+|\/+$/g, "").replace(/\.\./g, "");
}

function sanitizeExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot < 0) {
    return ".jpg";
  }
  const ext = filename.slice(dot).toLowerCase();
  if (ext === ".jpeg") {
    return ".jpg";
  }
  return ext;
}

function toThumbPath(path: string): string {
  return `thumbs/${path.replace(/\.[^.]+$/, ".webp")}`;
}

async function buildThumbnail(imageBytes: Buffer): Promise<Buffer> {
  return sharp(imageBytes, { animated: true })
    .rotate()
    .resize(420, 260, { fit: "cover" })
    .webp({ quality: 72 })
    .toBuffer();
}

async function getNextSequenceStart(folder: string, prefix: "wallpaper" | "pfp"): Promise<number> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage.from(env.bucketName).list(folder, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" }
  });

  if (error) {
    throw new Error(error.message);
  }

  const pattern = new RegExp(`^${prefix}_(\\\\d+)\\\\.[^.]+$`, "i");
  let maxIndex = 0;

  for (const entry of data ?? []) {
    if (!entry.id) {
      continue;
    }
    const match = entry.name.match(pattern);
    if (!match) {
      continue;
    }
    const index = Number(match[1]);
    if (Number.isFinite(index) && index > maxIndex) {
      maxIndex = index;
    }
  }

  return maxIndex + 1;
}

export async function loginAdmin(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (email !== env.adminEmail || password !== env.adminPassword) {
    redirect("/admin/login?error=invalid");
  }

  await setAdminSession();
  redirect("/admin");
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/");
}

export async function uploadWallpaper(formData: FormData) {
  try {
    if (!(await isAdminAuthenticated())) {
      redirect("/admin/login");
    }

    const files = formData.getAll("files").filter((item): item is File => item instanceof File);
    const folder = sanitizeFolder(String(formData.get("folder") ?? ""));
    const selectedType = String(formData.get("assetType") ?? "wallpaper");
    const assetType: "wallpaper" | "pfp" = selectedType === "pfp" ? "pfp" : "wallpaper";

    if (!files.length) {
      redirect("/admin?error=no-files");
    }

    const supabase = createSupabaseAdminClient();
    const targetFolder = assetType === "pfp" ? "PFP" : folder;
    const prefix = assetType;
    const pad = assetType === "pfp" ? 3 : 4;
    let nextIndex = await getNextSequenceStart(targetFolder, prefix);

    for (const file of files) {
      if (!file.name || file.size === 0) {
        continue;
      }

      if (!file.type.startsWith("image/")) {
        redirect("/admin?error=only-image-files-are-allowed");
      }

      const extension = sanitizeExtension(file.name);
      const filename = `${prefix}_${String(nextIndex).padStart(pad, "0")}${extension}`;
      const path = targetFolder ? `${targetFolder}/${filename}` : filename;
      nextIndex += 1;

      const bytes = Buffer.from(await file.arrayBuffer());
      const { error } = await supabase.storage.from(env.bucketName).upload(path, bytes, {
        contentType: file.type || undefined,
        cacheControl: "31536000",
        upsert: false
      });

      if (error) {
        redirect(`/admin?error=${encodeURIComponent(error.message)}`);
      }

      let thumbBytes: Buffer;
      try {
        thumbBytes = await buildThumbnail(bytes);
      } catch {
        redirect("/admin?error=thumbnail-generation-failed-for-one-or-more-files");
      }

      const thumbPath = toThumbPath(path);
      const { error: thumbError } = await supabase.storage.from(env.bucketName).upload(thumbPath, thumbBytes, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: true
      });

      if (thumbError) {
        redirect(`/admin?error=${encodeURIComponent(thumbError.message)}`);
      }
    }

    revalidatePath("/");
    revalidatePath("/admin");
    revalidateTag("wallpapers");
    redirect("/admin?success=uploaded");
  } catch (error) {
    const digest =
      typeof error === "object" && error !== null && "digest" in error
        ? String((error as { digest?: string }).digest)
        : "";
    if (digest.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "upload-failed";
    redirect(`/admin?error=${encodeURIComponent(message)}`);
  }
}

export async function deleteWallpaper(formData: FormData) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const path = String(formData.get("path") ?? "").trim();
  if (!path) {
    redirect("/admin?error=missing-path");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage.from(env.bucketName).remove([path, toThumbPath(path)]);

  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidateTag("wallpapers");
  redirect("/admin?success=deleted");
}
