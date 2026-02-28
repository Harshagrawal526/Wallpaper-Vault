import { createClient } from "@supabase/supabase-js";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "wallpapers";
const SOURCE = process.env.LOCAL_THUMBNAIL_DIR || "thumbnails/4k wallpaper";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function walk(dir) {
  const items = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const item of items) {
    const p = join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...(await walk(p)));
    } else {
      files.push(p);
    }
  }
  return files;
}

const all = await walk(SOURCE);
const thumbFiles = all.filter((file) => file.toLowerCase().endsWith(".webp"));

let uploaded = 0;
for (const file of thumbFiles) {
  const rel = relative(SOURCE, file).replaceAll("\\", "/");
  const pathInBucket = `thumbs/${rel}`;
  const bytes = await readFile(file);

  const { error } = await supabase.storage.from(BUCKET).upload(pathInBucket, bytes, {
    upsert: true,
    cacheControl: "31536000",
    contentType: "image/webp"
  });

  if (error) {
    console.error(`Failed: ${pathInBucket} -> ${error.message}`);
    continue;
  }

  uploaded += 1;
  if (uploaded % 50 === 0) {
    console.log(`Uploaded ${uploaded}/${thumbFiles.length}`);
  }
}

console.log(`Done. Uploaded ${uploaded}/${thumbFiles.length} thumbnails to ${BUCKET}/thumbs.`);
