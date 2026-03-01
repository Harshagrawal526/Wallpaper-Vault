import Link from "next/link";

import { deleteWallpaper, logoutAdmin, uploadWallpaper } from "@/app/actions";
import { requireAdminUser } from "@/lib/admin";
import { listWallpapers } from "@/lib/storage";

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  await requireAdminUser();

  const params = await searchParams;
  const wallpapers = await listWallpapers();

  return (
    <main className="mx-auto mt-5 mb-10 w-[94vw] max-w-6xl text-textMain">
      <Link className="mb-2 inline-block text-sm font-semibold text-accent hover:underline" href="/">
        Back to gallery
      </Link>
      <h1 className="mb-4 text-3xl font-semibold">Admin Dashboard</h1>

      {params.success ? <p className="mb-2 text-sm text-emerald-300">Success: {params.success}</p> : null}
      {params.error ? <p className="mb-3 text-sm text-red-300">Error: {params.error}</p> : null}

      <form className="mb-4 rounded-2xl border border-white/10 bg-[#070c18c2] p-4" action={uploadWallpaper}>
        <h3 className="mb-1 text-xl font-semibold">Upload Wallpapers</h3>
        <p className="mb-4 text-sm text-muted">Choose what you are uploading.</p>

        <div className="mb-4 flex items-center gap-5">
          <label className="inline-flex items-center gap-2 text-sm">
            <input className="h-4 w-4" type="radio" name="assetType" value="wallpaper" defaultChecked /> Wallpaper
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input className="h-4 w-4" type="radio" name="assetType" value="pfp" /> PFP
          </label>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm" htmlFor="folder">
            Folder path (optional, wallpaper only)
          </label>
          <input
            id="folder"
            name="folder"
            placeholder="anime / cars / nature"
            className="w-full rounded-xl border border-white/20 bg-[#0a1221c7] px-3 py-2 text-textMain outline-none"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm" htmlFor="files">
            Choose files
          </label>
          <input
            id="files"
            name="files"
            type="file"
            accept="image/*"
            multiple
            required
            className="w-full rounded-xl border border-white/20 bg-[#0a1221c7] px-3 py-2 text-textMain"
          />
        </div>

        <button className="rounded-xl bg-accent px-4 py-2 font-semibold text-[#081522]" type="submit">
          Upload
        </button>
      </form>

      <form action={logoutAdmin} className="mb-5">
        <button className="rounded-xl bg-white/15 px-4 py-2 font-semibold text-textMain" type="submit">
          Logout
        </button>
      </form>

      <h3 className="mb-3 text-xl font-semibold">Current Files ({wallpapers.length})</h3>
      <section className="grid gap-2.5">
        {wallpapers.map((item) => (
          <div
            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#070c18c2] p-3 max-md:flex-col max-md:items-start"
            key={item.path}
          >
            <div>
              <strong className="text-sm">{item.name}</strong>
              <br />
              <code className="text-xs text-muted">{item.path}</code>
            </div>
            <form action={deleteWallpaper}>
              <input type="hidden" name="path" value={item.path} />
              <button className="rounded-xl bg-white/15 px-3 py-1.5 text-sm font-semibold text-textMain" type="submit">
                Delete
              </button>
            </form>
          </div>
        ))}
      </section>
    </main>
  );
}
