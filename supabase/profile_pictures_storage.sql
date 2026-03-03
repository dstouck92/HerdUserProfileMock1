-- Profile picture uploads: RLS for bucket "profile-pictures"
-- Run this in Supabase Dashboard → SQL Editor.
--
-- Prerequisite: Create the bucket in Dashboard → Storage → New bucket:
--   - Name: profile-pictures
--   - Public: ON (so getPublicUrl() works for avatars)
--
-- These policies allow authenticated users to upload/update only under their own folder (path: {user_id}/...).

-- Allow authenticated users to upload to their own folder only
drop policy if exists "Users can upload own profile picture" on storage.objects;
create policy "Users can upload own profile picture"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = (auth.uid())::text
);

-- Allow overwrite (upsert) — user can update objects in their folder
drop policy if exists "Users can update own profile picture" on storage.objects;
create policy "Users can update own profile picture"
on storage.objects for update to authenticated
using (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = (auth.uid())::text
)
with check (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = (auth.uid())::text
);

-- SELECT required for upsert; also allows public read if bucket is public
drop policy if exists "Profile pictures are readable" on storage.objects;
create policy "Profile pictures are readable"
on storage.objects for select to public
using (bucket_id = 'profile-pictures');

-- Allow users to delete their own profile pictures (optional)
drop policy if exists "Users can delete own profile picture" on storage.objects;
create policy "Users can delete own profile picture"
on storage.objects for delete to authenticated
using (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = (auth.uid())::text
);
