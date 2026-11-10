-- Follow-up security hardening on dedicated Afrinet Hub project only.
-- Replace the public order-number RPC's privileged sequence operation with
-- a pure random identifier that can run as the API caller.
create or replace function public.generate_order_number()
returns text
language sql volatile security invoker
set search_path = ''
as $$
  select 'ANH-' || to_char(now() at time zone 'UTC','YYYYMMDD')
      || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,16));
$$;
revoke all on function public.generate_order_number() from public;
grant execute on function public.generate_order_number() to anon, authenticated;

-- Admin-managed published announcements may include PDF files as attachments.
-- Customer documents and receipts remain in the separate PRIVATE bucket.
update storage.buckets
set allowed_mime_types = array['image/jpeg','image/png','image/webp','application/pdf']
where id = 'afrinethub-media';
