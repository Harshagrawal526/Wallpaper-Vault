# Wallpaper Vault

A personal full-stack project to host, browse, and manage a wallpaper library with a fast gallery UX.

## Live Project Highlights
- Clean gallery with search and folder filters
- Thumbnail-first loading for fast scroll performance
- 25 images per page with previous/next navigation
- Dedicated wallpaper detail page with download button
- Admin area ("Boss Cabin") for upload/delete management
- Automatic thumbnail generation on every admin upload

## Tech Stack
- Next.js (App Router)
- TypeScript
- Supabase Storage
- Vercel

## Local Setup
1. Install dependencies:
```bash
npm install
```

2. Create env file:
```bash
cp .env.example .env.local
```

3. Fill required env values in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET` (default: `wallpapers`)
- `SUPABASE_BUCKET_PUBLIC` (`true` recommended)
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

4. Run dev server:
```bash
npm run dev
```

## Supabase Storage Setup
Run in Supabase SQL Editor:

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

## One-Time Bulk Upload Scripts
Upload original images from local folder:
```bash
node upload_local_to_supabase.mjs
```

Upload generated thumbnails to `thumbs/` in bucket:
```bash
node upload_thumbnails_to_supabase.mjs
```

## Deployment (Vercel)
1. Import this repository in Vercel.
2. Add all environment variables from `.env.local` into Vercel Project Settings.
3. Deploy.

## Notes
- Next.js is pinned to a patched `15.x` release to satisfy Vercel security checks.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only; never expose it in client code.
