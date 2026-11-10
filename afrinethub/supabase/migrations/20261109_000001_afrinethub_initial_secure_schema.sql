-- AfriNet Hub / UNILESA — fresh dedicated Supabase project only.
-- DRAFT / NOT APPLIED. Never run against Gwebstore, SLT TradeHub or an existing database.
-- Apply only after confirming a fresh AfriNet Hub project ref and an approved admin auth user.
-- All public tables have RLS; private customer information is never publicly selectable.

create extension if not exists pgcrypto;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;
grant usage on schema app_private to authenticated;

create table if not exists public.admin_config (
  id text primary key default 'setup',
  uid uuid not null unique references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint singleton_admin check (id = 'setup')
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  status text not null default 'Pending'
    check (status in ('Pending','Paid','Printed','Ready','Collected')),
  data jsonb not null default '{}'::jsonb
    check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 65536),
  created_at timestamptz not null default now()
);

create table if not exists public.portal_requests (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'Pending' check (status in ('Pending','Handled')),
  data jsonb not null default '{}'::jsonb
    check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 16384),
  -- Defensive invariant: an administrator cannot accidentally store a portal password.
  portal_password_plain text null check (portal_password_plain is null),
  created_at timestamptz not null default now()
);

create table if not exists public.project_requests (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'Pending' check (status in ('Pending','Handled')),
  data jsonb not null default '{}'::jsonb
    check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 16384),
  created_at timestamptz not null default now()
);

create table if not exists public.advert_requests (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'Pending' check (status in ('Pending','Handled')),
  data jsonb not null default '{}'::jsonb
    check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 16384),
  created_at timestamptz not null default now()
);

create table if not exists public.feedback_suggestions (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'Pending' check (status in ('Pending','Handled')),
  data jsonb not null default '{}'::jsonb
    check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 16384),
  created_at timestamptz not null default now()
);

create table if not exists public.adverts (
  id uuid primary key default gen_random_uuid(),
  placement text not null default 'Both',
  start_date timestamptz not null default now(),
  end_date timestamptz not null,
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data)='object'),
  created_at timestamptz not null default now(),
  constraint advert_date_order check (end_date > start_date)
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  expiry_date timestamptz not null,
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data)='object'),
  created_at timestamptz not null default now()
);

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 150),
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data)='object'),
  created_at timestamptz not null default now()
);

create table if not exists public.gadget_products (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data)='object'),
  created_at timestamptz not null default now()
);

create table if not exists public.housing_listings (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  price_period text,
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data)='object'),
  created_at timestamptz not null default now()
);

create index if not exists idx_afrinethub_orders_created on public.orders(created_at desc);
create index if not exists idx_afrinethub_adverts_end on public.adverts(end_date);
create index if not exists idx_afrinethub_announcements_expiry on public.announcements(expiry_date);
create index if not exists idx_afrinethub_products_category on public.gadget_products(category);
create index if not exists idx_afrinethub_housing_type on public.housing_listings(type);

-- Private function is NOT in the exposed public API schema.
create or replace function app_private.is_afrinethub_admin()
returns boolean language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_config a
    where a.id = 'setup'
      and a.uid = (select auth.uid())
      and (select auth.uid()) is not null
  );
$$;
revoke all on function app_private.is_afrinethub_admin() from public;
grant execute on function app_private.is_afrinethub_admin() to authenticated;

alter table public.admin_config enable row level security;
alter table public.orders enable row level security;
alter table public.portal_requests enable row level security;
alter table public.project_requests enable row level security;
alter table public.advert_requests enable row level security;
alter table public.feedback_suggestions enable row level security;
alter table public.adverts enable row level security;
alter table public.announcements enable row level security;
alter table public.partners enable row level security;
alter table public.gadget_products enable row level security;
alter table public.housing_listings enable row level security;

-- Explicit grants: RLS is a separate row filter.
revoke all on public.admin_config from anon, authenticated;
revoke all on public.orders from anon, authenticated;
revoke all on public.portal_requests from anon, authenticated;
revoke all on public.project_requests from anon, authenticated;
revoke all on public.advert_requests from anon, authenticated;
revoke all on public.feedback_suggestions from anon, authenticated;
revoke all on public.adverts from anon, authenticated;
revoke all on public.announcements from anon, authenticated;
revoke all on public.partners from anon, authenticated;
revoke all on public.gadget_products from anon, authenticated;
revoke all on public.housing_listings from anon, authenticated;

grant select on public.admin_config to authenticated;
create policy afrinethub_admin_self_select on public.admin_config
  for select to authenticated
  using (uid=(select auth.uid()));

-- Customer tables: anonymous inserts permitted, but no anonymous SELECT,
-- UPDATE or DELETE. Add CAPTCHA + server-side rate limiting BEFORE production.
grant insert on public.orders,public.portal_requests,public.project_requests,
  public.advert_requests,public.feedback_suggestions to anon, authenticated;
grant select,update,delete on public.orders,public.portal_requests,public.project_requests,
  public.advert_requests,public.feedback_suggestions to authenticated;

create policy afrinethub_public_submit_order on public.orders
  for insert to anon,authenticated
  with check (status='Pending' and char_length(order_number) between 8 and 80);
create policy afrinethub_public_submit_portal on public.portal_requests
  for insert to anon,authenticated
  with check (status='Pending' and portal_password_plain is null
    and not (data ? 'portalPassword') and not (data ? 'password'));
create policy afrinethub_public_submit_project on public.project_requests
  for insert to anon,authenticated with check (status='Pending');
create policy afrinethub_public_submit_advert on public.advert_requests
  for insert to anon,authenticated with check (status='Pending');
create policy afrinethub_public_submit_feedback on public.feedback_suggestions
  for insert to anon,authenticated with check (status='Pending');

create policy afrinethub_admin_read_orders on public.orders for select to authenticated
  using ((select app_private.is_afrinethub_admin()));
create policy afrinethub_admin_read_portal on public.portal_requests for select to authenticated
  using ((select app_private.is_afrinethub_admin()));
create policy afrinethub_admin_read_projects on public.project_requests for select to authenticated
  using ((select app_private.is_afrinethub_admin()));
create policy afrinethub_admin_read_advert_requests on public.advert_requests for select to authenticated
  using ((select app_private.is_afrinethub_admin()));
create policy afrinethub_admin_read_feedback on public.feedback_suggestions for select to authenticated
  using ((select app_private.is_afrinethub_admin()));

create policy afrinethub_admin_update_orders on public.orders for update to authenticated
  using ((select app_private.is_afrinethub_admin()))
  with check ((select app_private.is_afrinethub_admin()));
create policy afrinethub_admin_update_portal on public.portal_requests for update to authenticated
  using ((select app_private.is_afrinethub_admin()))
  with check ((select app_private.is_afrinethub_admin()));
create policy afrinethub_admin_update_projects on public.project_requests for update to authenticated
  using ((select app_private.is_afrinethub_admin()))
  with check ((select app_private.is_afrinethub_admin()));
create policy afrinethub_admin_update_advert_requests on public.advert_requests for update to authenticated
  using ((select app_private.is_afrinethub_admin()))
  with check ((select app_private.is_afrinethub_admin()));
create policy afrinethub_admin_update_feedback on public.feedback_suggestions for update to authenticated
  using ((select app_private.is_afrinethub_admin()))
  with check ((select app_private.is_afrinethub_admin()));

create policy afrinethub_admin_delete_orders on public.orders for delete to authenticated
  using ((select app_private.is_afrinethub_admin()));
create policy afrinethub_admin_delete_portal on public.portal_requests for delete to authenticated
  using ((select app_private.is_afrinethub_admin()));
create policy afrinethub_admin_delete_projects on public.project_requests for delete to authenticated
  using ((select app_private.is_afrinethub_admin()));
create policy afrinethub_admin_delete_advert_requests on public.advert_requests for delete to authenticated
  using ((select app_private.is_afrinethub_admin()));
create policy afrinethub_admin_delete_feedback on public.feedback_suggestions for delete to authenticated
  using ((select app_private.is_afrinethub_admin()));

-- Listings and news can be read by visitors. Admin manages full content.
grant select on public.adverts,public.announcements,public.partners,
  public.gadget_products,public.housing_listings to anon,authenticated;
grant insert,update,delete on public.adverts,public.announcements,public.partners,
  public.gadget_products,public.housing_listings to authenticated;

create policy afrinethub_public_adverts on public.adverts for select to anon,authenticated
  using (start_date <= now() and end_date >= now());
create policy afrinethub_public_announcements on public.announcements for select to anon,authenticated
  using (expiry_date >= now());
create policy afrinethub_public_partners on public.partners for select to anon,authenticated using (true);
create policy afrinethub_public_gadgets on public.gadget_products for select to anon,authenticated using (true);
create policy afrinethub_public_housing on public.housing_listings for select to anon,authenticated using (true);

create policy afrinethub_admin_read_adverts on public.adverts for select to authenticated
  using ((select app_private.is_afrinethub_admin()));
create policy afrinethub_admin_read_announcements on public.announcements for select to authenticated
  using ((select app_private.is_afrinethub_admin()));

create policy afrinethub_admin_insert_adverts on public.adverts for insert to authenticated
  with check ((select app_private.is_afrinethub_admin()));
create policy afrinethub_admin_insert_announcements on public.announcements for insert to authenticated
  with check ((select app_private.is_afrinethub_admin()));
create policy afrinethub_admin_insert_partners on public.partners for insert to authenticated
  with check ((select app_private.is_afrinethub_admin()));
create policy afrinethub_admin_insert_gadgets on public.gadget_products for insert to authenticated
  with check ((select app_private.is_afrinethub_admin()));
create policy afrinethub_admin_insert_housing on public.housing_listings for insert to authenticated
  with check ((select app_private.is_afrinethub_admin()));

create policy afrinethub_admin_update_adverts on public.adverts for update to authenticated
  using ((select app_private.is_afrinethub_admin()))
  with check ((select app_private.is_afrinethub_admin()));
create policy afrinethub_admin_update_announcements on public.announcements for update to authenticated
  using ((select app_private.is_afrinethub_admin()))
  with check ((select app_private.is_afrinethub_admin()));
create policy afrinethub_admin_update_partners on public.partners for update to authenticated
  using ((select app_private.is_afrinethub_admin()))
  with check ((select app_private.is_afrinethub_admin()));
create policy afrinethub_admin_update_gadgets on public.gadget_products for update to authenticated
  using ((select app_private.is_afrinethub_admin()))
  with check ((select app_private.is_afrinethub_admin()));
create policy afrinethub_admin_update_housing on public.housing_listings for update to authenticated
  using ((select app_private.is_afrinethub_admin()))
  with check ((select app_private.is_afrinethub_admin()));

create policy afrinethub_admin_delete_adverts on public.adverts for delete to authenticated
  using ((select app_private.is_afrinethub_admin()));
create policy afrinethub_admin_delete_announcements on public.announcements for delete to authenticated
  using ((select app_private.is_afrinethub_admin()));
create policy afrinethub_admin_delete_partners on public.partners for delete to authenticated
  using ((select app_private.is_afrinethub_admin()));
create policy afrinethub_admin_delete_gadgets on public.gadget_products for delete to authenticated
  using ((select app_private.is_afrinethub_admin()));
create policy afrinethub_admin_delete_housing on public.housing_listings for delete to authenticated
  using ((select app_private.is_afrinethub_admin()));

-- Compatibility with the existing two front-end RPC calls.
-- SECURITY DEFINER is unavoidable here for a specific UUID-authorized checkout lookup.
-- Read only the exact row identified by a 128-bit UUID; this ID is a bearer secret.
create sequence if not exists app_private.afrinethub_order_seq;

create or replace function public.generate_order_number()
returns text language sql volatile security definer
set search_path = ''
as $$
  select 'ANH-' || to_char(now() at time zone 'UTC','YYYYMMDD')
    || '-' || lpad(nextval('app_private.afrinethub_order_seq'::regclass)::text,6,'0');
$$;
revoke all on function public.generate_order_number() from public;
grant execute on function public.generate_order_number() to anon,authenticated;

create or replace function public.get_order_by_id(p_id uuid)
returns table (
  id uuid,
  order_number text,
  status text,
  data jsonb,
  created_at timestamptz
)
language sql stable security definer
set search_path = ''
as $$
  select o.id,o.order_number,o.status,o.data,o.created_at
    from public.orders o where o.id=p_id limit 1;
$$;
revoke all on function public.get_order_by_id(uuid) from public;
grant execute on function public.get_order_by_id(uuid) to anon,authenticated;

-- Storage: private customer files (documents, payment receipts) may NEVER be public.
-- Admin media is public only for intentionally published marketing/listing images.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values
 ('afrinethub-private','afrinethub-private',false,10485760,
  array['application/pdf','image/jpeg','image/png','image/webp',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
 ('afrinethub-media','afrinethub-media',true,10485760,
  array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Only an authenticated approved admin can upload/edit published media.
-- Customer document uploads need a server-validated signed upload endpoint,
-- with authentication/captcha and a temporary token; do not grant anonymous storage writes.
create policy afrinethub_media_admin_upload on storage.objects for insert to authenticated
  with check (bucket_id='afrinethub-media' and (select app_private.is_afrinethub_admin()));
create policy afrinethub_media_admin_update on storage.objects for update to authenticated
  using (bucket_id='afrinethub-media' and (select app_private.is_afrinethub_admin()))
  with check (bucket_id='afrinethub-media' and (select app_private.is_afrinethub_admin()));
create policy afrinethub_media_admin_delete on storage.objects for delete to authenticated
  using (bucket_id='afrinethub-media' and (select app_private.is_afrinethub_admin()));
create policy afrinethub_media_public_read on storage.objects for select to anon,authenticated
  using (bucket_id='afrinethub-media');

-- No general SELECT / INSERT / UPDATE / DELETE policies for afrinethub-private.
-- A trusted server can use restricted service credentials and short-lived signed URLs.
-- DO NOT store service-role keys in frontend code or a public Git repository.

-- Optional realtime table publication; SELECT is still filtered by RLS.
do $$
declare t text;
begin
  foreach t in array array[
    'adverts','announcements','partners','gadget_products','housing_listings',
    'orders','portal_requests','project_requests','advert_requests','feedback_suggestions'
  ]
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I',t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- ADMIN BOOTSTRAP (manual, after Auth user exists; never paste any password into SQL):
-- insert into public.admin_config(id,uid)
-- values('setup','<AUTH_USER_UUID>');
--
-- STOP BEFORE LAUNCH until verified:
-- 1. Anonymous private-table SELECT is denied; anonymous submit is allowed only for requests.
-- 2. Anonymous storage uploads are denied. Server-signed customer uploads are implemented.
-- 3. Existing browser client is switched to the dedicated project and media/private bucket design.
-- 4. Login confirms only the provisioned admin user can see/modify records.
-- 5. CAPTCHA / rate limiting, order-checkout lifecycle, file cleanup & retention tests pass.
