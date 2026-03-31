-- Storage Setup for Profile Images
-- Run this in Supabase SQL Editor

create storage.buckets (id, name, owner, public)
values ('profile_images', 'profile_images', null, true) on conflict do nothing;

alter storage.objects enable row level security;

drop policy if exists profile_images_select_public on storage.objects;
create policy profile_images_select_public
  on storage.objects for select
  to public
  using (bucket_id = 'profile_images');

drop policy if exists profile_images_insert_auth on storage.objects;
create policy profile_images_insert_auth
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'profile_images' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists profile_images_update_auth on storage.objects;
create policy profile_images_update_auth
  on storage.objects for update
  to authenticated
  using (bucket_id = 'profile_images' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists profile_images_delete_auth on storage.objects;
create policy profile_images_delete_auth
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'profile_images' and auth.uid()::text = (storage.foldername(name))[1]);
