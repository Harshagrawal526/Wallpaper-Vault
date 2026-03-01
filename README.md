# Wallpaper Vault

A personal full-stack wallpaper gallery with admin-managed uploads, thumbnail optimization, and Supabase-backed storage.

Live URL: https://wallpaper-vault-eosin.vercel.app/

## Tech Stack
- Next.js (App Router)
- Tailwind CSS
- Supabase Auth + Storage
- Vercel

## Features
- Fast gallery with thumbnail-first loading
- Search + folder filter + pagination (24 per page)
- Full image page with download action
- Admin area ("Boss Cabin") for upload/delete
- Upload mode selector: `Wallpaper` or `PFP`
- Auto naming on upload:
  - `wallpaper_0001.*` (and onward)
  - `pfp_001.*` (and onward)
- Auto thumbnail generation on upload (`thumbs/...`)

## Environment
Create `.env.local` from example:

```bash
cp .env.example .env.local
```

Required values:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET` (default: `wallpapers`)
- `SUPABASE_BUCKET_PUBLIC` (`true` recommended)
- `ADMIN_EMAIL` (the only email allowed to access `/admin`)

## Admin Auth (Simple Supabase Version)
This project now uses **Supabase email/password auth**.

How it works:
1. User logs in from `/admin/login` using Supabase Auth credentials.
2. Server checks current authenticated user email.
3. Admin access is allowed only when `user.email === ADMIN_EMAIL`.

You should create the admin user in Supabase Auth Dashboard first.

## Supabase Storage Setup
Run this SQL in Supabase SQL Editor:

```sql
insert into storage.buckets (id, name, public)
values ('wallpapers', 'wallpapers', true)
on conflict (id) do update set public = true;

create policy "Public read wallpapers"
on storage.objects
for select
to public
using (bucket_id = 'wallpapers');

create policy "Service role full access wallpapers"
on storage.objects
for all
to service_role
using (bucket_id = 'wallpapers')
with check (bucket_id = 'wallpapers');
```

## Local Run
```bash
npm install
npm run dev
```

## Bulk Scripts
Upload originals:
```bash
node upload_local_to_supabase.mjs
```

Upload thumbnails:
```bash
node upload_thumbnails_to_supabase.mjs
```

Cleanup stale thumbnails:
```bash
node cleanup_stale_thumbnails.mjs
node cleanup_stale_thumbnails.mjs --delete
```

Migrate existing PFP names to `pfp_001` format:
```bash
node migrate_pfp_names.mjs
node migrate_pfp_names.mjs --apply
```

## Deploy (Vercel)
1. Import repo into Vercel.
2. Add all env vars from `.env.local`.
3. Deploy.
