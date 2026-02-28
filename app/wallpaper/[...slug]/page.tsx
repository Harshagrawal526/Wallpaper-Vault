import { notFound } from "next/navigation";

import { wallpaperByPath } from "@/lib/storage";
import { BackButton } from "@/app/wallpaper/[...slug]/back-button";

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
    <main className="detail-wrap">
      <BackButton fallbackHref={backHref} />
      <h1>{wallpaper.name}</h1>

      <article className="detail-card">
        <img
          className="detail-image"
          src={wallpaper.fullUrl}
          alt={wallpaper.name}
          width={1920}
          height={1080}
          loading="eager"
        />
        <div className="detail-meta">
          <p>{wallpaper.path}</p>
          <a className="download-btn" href={wallpaper.fullUrl} download={wallpaper.name}>
            Download full image
          </a>
        </div>
      </article>
    </main>
  );
}
