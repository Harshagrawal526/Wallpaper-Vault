import Link from "next/link";
import { notFound } from "next/navigation";

import { wallpaperByPath } from "@/lib/storage";

export default async function WallpaperPage({
  params
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const path = slug.map(decodeURIComponent).join("/");
  const wallpaper = await wallpaperByPath(path);

  if (!wallpaper) {
    notFound();
  }

  return (
    <main className="detail-wrap">
      <Link href="/" className="back-link">
        Back to gallery
      </Link>
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
