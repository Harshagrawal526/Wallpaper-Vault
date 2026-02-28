import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "wallpapers";
const APPLY = process.argv.includes("--apply");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

function ext(path) {
  const idx = path.lastIndexOf(".");
  return idx >= 0 ? path.slice(idx).toLowerCase() : ".jpg";
}

function toThumbPath(path) {
  return `thumbs/${path.replace(/\.[^.]+$/, ".webp")}`;
}

function tmpName(index, extension) {
  return `PFP/__tmp_pfp_${String(index).padStart(3, "0")}${extension}`;
}

function finalName(index, extension) {
  return `PFP/pfp_${String(index).padStart(3, "0")}${extension}`;
}

const { data, error } = await supabase.storage.from(BUCKET).list("PFP", {
  limit: 1000,
  sortBy: { column: "name", order: "asc" }
});

if (error) {
  throw new Error(`Failed to list PFP folder: ${error.message}`);
}

const files = (data || [])
  .filter((item) => item.id)
  .map((item) => `PFP/${item.name}`)
  .sort((a, b) => a.localeCompare(b));

if (!files.length) {
  console.log("No files found in PFP folder.");
  process.exit(0);
}

const plan = files.map((from, i) => {
  const index = i + 1;
  const extension = ext(from) === ".jpeg" ? ".jpg" : ext(from);
  const to = finalName(index, extension);
  const fromThumb = toThumbPath(from);
  const toThumb = toThumbPath(to);
  return { from, to, fromThumb, toThumb, index, extension };
});

console.log(`PFP files found: ${files.length}`);
console.log("Rename preview:");
for (const item of plan.slice(0, 12)) {
  console.log(`- ${item.from} -> ${item.to}`);
}

if (!APPLY) {
  console.log("Dry run only. Use --apply to execute rename.");
  process.exit(0);
}

// Phase 1: move originals to temp names to avoid collisions.
for (const item of plan) {
  const temp = tmpName(item.index, item.extension);
  const { error: moveError } = await supabase.storage.from(BUCKET).move(item.from, temp);
  if (moveError) {
    throw new Error(`Failed moving ${item.from} -> ${temp}: ${moveError.message}`);
  }

  const fromThumbExists = await supabase.storage.from(BUCKET).list(`thumbs/PFP`, {
    search: item.fromThumb.split("/").pop(),
    limit: 1
  });

  if (!fromThumbExists.error && (fromThumbExists.data || []).length > 0) {
    const tempThumb = `thumbs/PFP/__tmp_pfp_${String(item.index).padStart(3, "0")}.webp`;
    const { error: thumbMoveError } = await supabase.storage.from(BUCKET).move(item.fromThumb, tempThumb);
    if (thumbMoveError) {
      throw new Error(`Failed moving ${item.fromThumb} -> ${tempThumb}: ${thumbMoveError.message}`);
    }
  }
}

// Phase 2: move temp names to final names.
for (const item of plan) {
  const temp = tmpName(item.index, item.extension);
  const { error: finalMoveError } = await supabase.storage.from(BUCKET).move(temp, item.to);
  if (finalMoveError) {
    throw new Error(`Failed moving ${temp} -> ${item.to}: ${finalMoveError.message}`);
  }

  const tempThumb = `thumbs/PFP/__tmp_pfp_${String(item.index).padStart(3, "0")}.webp`;
  const tempThumbCheck = await supabase.storage.from(BUCKET).list("thumbs/PFP", {
    search: tempThumb.split("/").pop(),
    limit: 1
  });

  if (!tempThumbCheck.error && (tempThumbCheck.data || []).length > 0) {
    const { error: finalThumbMoveError } = await supabase.storage.from(BUCKET).move(tempThumb, item.toThumb);
    if (finalThumbMoveError) {
      throw new Error(`Failed moving ${tempThumb} -> ${item.toThumb}: ${finalThumbMoveError.message}`);
    }
  }
}

console.log(`Rename complete. Updated ${plan.length} PFP files.`);
