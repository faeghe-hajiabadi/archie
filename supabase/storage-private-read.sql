-- Run this in Supabase: SQL Editor → New query → paste → Run
-- Required when using a PRIVATE "pet-images" bucket so logged-in users can see images via signed URLs.
-- Allows authenticated users to read (SELECT) their own files so createSignedUrl() works.

drop policy if exists "Users can read own pet images" on storage.objects;
create policy "Users can read own pet images"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'pet-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
