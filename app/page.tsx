import Link from "next/link";

import { GalleryClient } from "@/app/gallery-client";
import { listWallpapers } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const wallpapers = await listWallpapers();

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
      <GalleryClient wallpapers={wallpapers} />
    </main>
  );
}
