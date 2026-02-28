# Wallpaper Vault (Next.js + Supabase)

## Stack
- Next.js (App Router)
- Supabase Storage
- Vercel deployment target

## Features
- Fast thumbnail gallery using Supabase image transforms
- Full image detail page with download link
- Admin login page
- Admin upload and delete controls

## 1) Environment
Create `.env.local`:

```bash
cp .env.example .env.local
```

Required values:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET` (default `wallpapers`)
- `SUPABASE_BUCKET_PUBLIC` (`true` recommended)
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

## 2) Supabase setup
Run this SQL in Supabase SQL editor:

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

## 3) Install and run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## 4) Upload existing local wallpapers to Supabase

```bash
node upload_local_to_supabase.mjs
```

Optional source directory override:

```bash
LOCAL_WALLPAPER_DIR="4k wallpaper" node upload_local_to_supabase.mjs
```

## 4.1) Upload pre-generated thumbnails (recommended)

```bash
node upload_thumbnails_to_supabase.mjs
```

Optional source directory override:

```bash
LOCAL_THUMBNAIL_DIR="thumbnails/4k wallpaper" node upload_thumbnails_to_supabase.mjs
```

## 5) Admin flow
- Login: `/admin/login`
- Dashboard: `/admin`
- Upload and delete images there

## 6) Deploy to Vercel
- Import this repo in Vercel
- Add same env vars in Vercel Project Settings
- Deploy
