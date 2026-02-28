"use client";

import Link from "next/link";
import { type SyntheticEvent, useEffect, useMemo, useState } from "react";

import type { Wallpaper } from "@/lib/storage";

export function GalleryClient({ wallpapers }: { wallpapers: Wallpaper[] }) {
  const pageSize = 25;
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState("all");
  const [page, setPage] = useState(1);

  const folders = useMemo(
    () => ["all", ...Array.from(new Set(wallpapers.map((item) => item.folder))).sort()],
    [wallpapers]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return wallpapers.filter((item) => {
      const matchesQuery = !q || item.path.toLowerCase().includes(q);
      const matchesFolder = folder === "all" || item.folder === folder;
      return matchesQuery && matchesFolder;
    });
  }, [folder, query, wallpapers]);

  useEffect(() => {
    setPage(1);
  }, [query, folder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const currentItems = filtered.slice(pageStart, pageStart + pageSize);

  const handleThumbError = (event: SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const fallback = img.dataset.fallbackSrc;
    if (!fallback || img.dataset.usedFallback === "1") {
      return;
    }
    img.dataset.usedFallback = "1";
    img.src = fallback;
  };

  return (
    <>
      <section className="toolbar" aria-label="Wallpaper controls">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search wallpapers..."
        />
        <select value={folder} onChange={(event) => setFolder(event.target.value)}>
          {folders.map((item) => (
            <option key={item} value={item}>
              {item === "all" ? "All folders" : item}
            </option>
          ))}
        </select>
        <p className="stats">
          {filtered.length} / {wallpapers.length} wallpapers
        </p>
      </section>

      <section className="gallery">
        {currentItems.map((item) => (
          <Link className="card" key={item.path} href={`/wallpaper/${item.path.split("/").map(encodeURIComponent).join("/")}`}>
            <img
              src={item.thumbUrl}
              alt={item.name}
              width={420}
              height={260}
              loading="lazy"
              decoding="async"
              data-fallback-src={item.fullUrl}
              onError={handleThumbError}
            />
            <div className="meta">
              <p className="name">{item.name}</p>
              <p className="folder">{item.folder}</p>
            </div>
          </Link>
        ))}
      </section>

      <nav className="pagination" aria-label="Gallery pagination">
        <button
          className="button alt"
          type="button"
          onClick={() => setPage((value) => Math.max(1, value - 1))}
          disabled={safePage === 1}
        >
          ←
        </button>
        <p>
          Page {safePage} of {totalPages}
        </p>
        <button
          className="button alt"
          type="button"
          onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          disabled={safePage === totalPages}
        >
          →
        </button>
      </nav>
    </>
  );
}
