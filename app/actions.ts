"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";

import { clearAdminSession, isAdminAuthenticated, setAdminSession } from "@/lib/admin-auth";
import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function sanitizeFolder(folder: string): string {
  return folder.trim().replace(/^\/+|\/+$/g, "").replace(/\.\./g, "");
}

function toThumbPath(path: string): string {
  return `thumbs/${path.replace(/\.[^.]+$/, ".webp")}`;
}

async function buildThumbnail(imageBytes: Buffer): Promise<Buffer> {
  return sharp(imageBytes).rotate().resize(420, 260, { fit: "cover" }).webp({ quality: 72 }).toBuffer();
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
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const files = formData.getAll("files").filter((item): item is File => item instanceof File);
  const folder = sanitizeFolder(String(formData.get("folder") ?? ""));

  if (!files.length) {
    redirect("/admin?error=no-files");
  }

  const supabase = createSupabaseAdminClient();

  for (const file of files) {
    if (!file.name || file.size === 0) {
      continue;
    }

    const safeName = sanitizeFileName(file.name);
    const path = folder
      ? `${folder}/${Date.now()}_${safeName}`
      : `${Date.now()}_${safeName}`;

    const bytes = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage.from(env.bucketName).upload(path, bytes, {
      contentType: file.type || undefined,
      cacheControl: "31536000",
      upsert: false
    });

    if (error) {
      redirect(`/admin?error=${encodeURIComponent(error.message)}`);
    }

    const thumbBytes = await buildThumbnail(bytes);
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
