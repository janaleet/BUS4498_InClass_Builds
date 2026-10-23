-- Stage 7: flyer photos.
-- Each post can have one flyer photo. Only the AI agent uploads photos; the website just shows them.

alter table public.events
  add column flyer_url text not null default '';

-- Visitors may read the photo link along with the other public columns.
grant select (flyer_url) on table public.events to anon, authenticated;

-- A public storage bucket for flyers: anyone can view a photo by its link, nobody else can upload.
-- No storage policies are added, so the website can't upload, change, or delete files.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('flyers', 'flyers', true, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
