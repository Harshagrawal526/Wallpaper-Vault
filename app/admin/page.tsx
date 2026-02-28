import Link from "next/link";
import { redirect } from "next/navigation";

import { deleteWallpaper, logoutAdmin, uploadWallpaper } from "@/app/actions";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listWallpapers } from "@/lib/storage";

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const wallpapers = await listWallpapers();

  return (
    <main className="detail-wrap">
      <Link className="back-link" href="/">
        Back to gallery
      </Link>
      <h1>Admin Dashboard</h1>

      {params.success ? <p>Success: {params.success}</p> : null}
      {params.error ? <p className="error">Error: {params.error}</p> : null}

      <form className="card-like upload-form" action={uploadWallpaper}>
        <h3>Upload Wallpapers</h3>
        <p>Choose what you are uploading.</p>
        <div className="upload-form-group upload-radio-group">
          <label>
            <input type="radio" name="assetType" value="wallpaper" defaultChecked /> Wallpaper
          </label>
          <label>
            <input type="radio" name="assetType" value="pfp" /> PFP
          </label>
        </div>
        <div className="upload-form-group">
          <label htmlFor="folder">Folder path (optional, wallpaper only)</label>
          <input id="folder" name="folder" placeholder="anime / cars / nature" />
        </div>
        <div className="upload-form-group">
          <label htmlFor="files">Choose files</label>
          <input id="files" name="files" type="file" accept="image/*" multiple required />
        </div>
        <button className="button" type="submit">
          Upload
        </button>
      </form>

      <form action={logoutAdmin}>
        <button className="button alt" type="submit">
          Logout
        </button>
      </form>

      <h3 style={{ marginTop: "1.2rem" }}>Current Files ({wallpapers.length})</h3>
      <section className="files">
        {wallpapers.map((item) => (
          <div className="file-row" key={item.path}>
            <div>
              <strong>{item.name}</strong>
              <br />
              <code>{item.path}</code>
            </div>
            <form action={deleteWallpaper}>
              <input type="hidden" name="path" value={item.path} />
              <button className="button alt" type="submit">
                Delete
              </button>
            </form>
          </div>
        ))}
      </section>
    </main>
  );
}
