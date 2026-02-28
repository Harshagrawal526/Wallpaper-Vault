import { createClient } from "@supabase/supabase-js";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "wallpapers";
const SOURCE = process.env.LOCAL_WALLPAPER_DIR || "4k wallpaper";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const allowed = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

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

function contentType(path) {
  const lower = path.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

const all = await walk(SOURCE);
const imageFiles = all.filter((file) => {
  const ext = file.slice(file.lastIndexOf(".")).toLowerCase();
  return allowed.has(ext);
});

let uploaded = 0;
for (const file of imageFiles) {
  const pathInBucket = relative(SOURCE, file).replaceAll("\\", "/");
  const bytes = await readFile(file);

  const { error } = await supabase.storage.from(BUCKET).upload(pathInBucket, bytes, {
    upsert: true,
    cacheControl: "31536000",
    contentType: contentType(file)
  });

  if (error) {
    console.error(`Failed: ${pathInBucket} -> ${error.message}`);
    continue;
  }

  uploaded += 1;
  if (uploaded % 20 === 0) {
    console.log(`Uploaded ${uploaded}/${imageFiles.length}`);
  }
}

const size = await Promise.all(imageFiles.map((file) => stat(file).then((s) => s.size)));
const totalMB = (size.reduce((a, b) => a + b, 0) / (1024 * 1024)).toFixed(2);

console.log(`Done. Uploaded ${uploaded}/${imageFiles.length} images from ${SOURCE}.`);
console.log(`Approx local payload: ${totalMB} MB.`);
