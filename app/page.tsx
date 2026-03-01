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
    <main className="mx-auto w-[94vw] max-w-6xl py-8 text-textMain">
      <header className="text-center">
        <h1 className="mb-3 text-5xl font-semibold leading-none max-md:text-4xl">Wallpaper Vault</h1>
        <p className="text-muted">Curated visuals for every mood.</p>
      </header>
      <div className="my-4 flex flex-wrap gap-3">
        <Link
          className="inline-block rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-textMain hover:bg-white/20"
          href="/admin/login"
        >
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
