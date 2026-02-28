import Link from "next/link";

import { GalleryClient } from "@/app/gallery-client";
import { listWallpapers } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ page?: string; q?: string; folder?: string }>;
}) {
  const wallpapers = await listWallpapers();
  const params = await searchParams;
  const initialPage = Number(params.page ?? "1");
  const initialQuery = params.q ?? "";
  const initialFolder = params.folder === "wallpapers" ? "root" : (params.folder ?? "all");

  return (
    <main className="page">
      <header className="hero">
        <h1>Wallpaper Vault</h1>
        <p>Curated visuals for every mood.</p>
      </header>
      <div className="admin-actions">
        <Link className="button alt" href="/admin/login">
          Boss Cabin
        </Link>
      </div>
      <GalleryClient
        wallpapers={wallpapers}
        initialPage={Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1}
        initialQuery={initialQuery}
        initialFolder={initialFolder}
      />
    </main>
  );
}
