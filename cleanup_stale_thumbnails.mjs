import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "wallpapers";
const SHOULD_DELETE = process.argv.includes("--delete");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const imageExt = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function ext(path) {
  const index = path.lastIndexOf(".");
  return index >= 0 ? path.slice(index).toLowerCase() : "";
}

function toThumbPath(path) {
  return `thumbs/${path.replace(/\.[^.]+$/, ".webp")}`;
}

async function listRecursive(folder = "") {
  const { data, error } = await supabase.storage.from(BUCKET).list(folder, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" }
  });

  if (error) {
    throw new Error(`List failed for '${folder}': ${error.message}`);
  }

  const files = [];
  for (const entry of data || []) {
    const nextPath = folder ? `${folder}/${entry.name}` : entry.name;
    if (entry.id) {
      files.push(nextPath);
      continue;
    }
    if (entry.name === ".emptyFolderPlaceholder") {
      continue;
    }
    files.push(...(await listRecursive(nextPath)));
  }
  return files;
}

const allFiles = await listRecursive("");
const fullImages = allFiles.filter((path) => !path.startsWith("thumbs/") && imageExt.has(ext(path)));
const thumbs = allFiles.filter((path) => path.startsWith("thumbs/") && path.toLowerCase().endsWith(".webp"));

const expectedThumbs = new Set(fullImages.map(toThumbPath));
const staleThumbs = thumbs.filter((path) => !expectedThumbs.has(path));

console.log(`Bucket: ${BUCKET}`);
console.log(`Full images: ${fullImages.length}`);
console.log(`Thumbnails: ${thumbs.length}`);
console.log(`Stale thumbnails: ${staleThumbs.length}`);

if (staleThumbs.length) {
  console.log("Sample stale thumbnails:");
  staleThumbs.slice(0, 20).forEach((path) => console.log(`- ${path}`));
}

if (SHOULD_DELETE && staleThumbs.length) {
  const chunkSize = 100;
  let deleted = 0;
  for (let i = 0; i < staleThumbs.length; i += chunkSize) {
    const chunk = staleThumbs.slice(i, i + chunkSize);
    const { error } = await supabase.storage.from(BUCKET).remove(chunk);
    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
    deleted += chunk.length;
  }
  console.log(`Deleted stale thumbnails: ${deleted}`);
} else if (!SHOULD_DELETE) {
  console.log("Dry run only. Use --delete to remove stale thumbnails.");
}
