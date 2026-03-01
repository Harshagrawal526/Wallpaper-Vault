import Link from "next/link";
import { notFound } from "next/navigation";

import { wallpaperByPath } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function WallpaperPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ back?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const path = slug.map(decodeURIComponent).join("/");
  const wallpaper = await wallpaperByPath(path);

  if (!wallpaper) {
    notFound();
  }

  const backHref = query.back && query.back.startsWith("/") ? query.back : "/";

  return (
    <main className="mx-auto mt-5 mb-10 w-[94vw] max-w-6xl text-textMain">
      <Link href={backHref} className="mb-2 inline-block bg-transparent p-0 text-sm font-semibold text-accent">
        Back to gallery
      </Link>
      <h1 className="mb-3 text-3xl font-semibold">{wallpaper.name}</h1>

      <article className="overflow-hidden rounded-2xl border border-white/10 bg-[#070c18c2] shadow-card">
        <img
          className="block max-h-[78vh] w-full bg-black object-contain"
          src={wallpaper.fullUrl}
          alt={wallpaper.name}
          width={1920}
          height={1080}
          loading="eager"
        />
        <div className="p-4">
          <p className="mb-3 break-all text-sm text-muted">{wallpaper.path}</p>
          <a
            className="inline-block rounded-xl bg-accent px-4 py-2 font-semibold text-[#081522]"
            href={wallpaper.fullUrl}
            download={wallpaper.name}
          >
            Download full image
          </a>
        </div>
      </article>
    </main>
  );
}
