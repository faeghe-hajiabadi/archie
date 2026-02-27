-- Run this in Supabase: SQL Editor → New query → paste → Run
-- 1. Adds image_url to pets so the Add Pet form can save a photo.
-- 2. Adds Storage RLS so authenticated users can upload to the "pet-images" bucket.
--
-- Step 1 (if not done): In Dashboard → Storage, create a bucket named "pet-images", set Public: Yes.
-- Step 2 (required): Run this entire script below. Without it, photo uploads are denied by RLS.

-- Add column to pets
alter table public.pets
add column if not exists image_url text;

comment on column public.pets.image_url is 'Storage path (e.g. userId/filename.jpg) for pet photo in bucket pet-images. Use signed URLs in the app for private bucket.';

-- RLS: allow authenticated users to upload to their own folder in pet-images
-- Path format: {owner_id}/{filename} so we use owner_id = auth.uid()::text
drop policy if exists "Users can upload pet images to own folder" on storage.objects;
create policy "Users can upload pet images to own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'pet-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update/delete their own uploads (e.g. replace photo)
drop policy if exists "Users can update own pet images" on storage.objects;
create policy "Users can update own pet images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'pet-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own pet images" on storage.objects;
create policy "Users can delete own pet images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'pet-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
