-- Dedicated Afrinet Hub project ONLY. API requests use Supabase Edge Function
-- Turnstile validation, scoped guest bearer sessions, and server-controlled writes.
create extension if not exists supabase_vault with schema vault;

create table if not exists app_private.guest_sessions (
 id uuid primary key default gen_random_uuid(),
 token_hash text not null unique check(length(token_hash)=64),
 ip_hash text not null check(length(ip_hash)=64),
 uploads integer not null default 0,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '2 hours')
);
create index if not exists idx_afri_guest_sessions_expiry on app_private.guest_sessions(expires_at);

create table if not exists app_private.guest_uploads (
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references app_private.guest_sessions(id) on delete cascade,
 path text not null unique,
 filename text not null,
 content_type text not null,
 size_bytes integer not null check(size_bytes between 1 and 10485760),
 created_at timestamptz not null default now()
);
create index if not exists idx_afri_guest_upload_session on app_private.guest_uploads(session_id);

create table if not exists app_private.guest_orders (
 session_id uuid not null references app_private.guest_sessions(id) on delete cascade,
 order_id uuid not null unique references public.orders(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(session_id,order_id)
);

create table if not exists app_private.api_rate_limits (
 rate_key text primary key,
 count integer not null default 0,
 period_start timestamptz not null default now()
);

alter table app_private.guest_sessions enable row level security;
alter table app_private.guest_uploads enable row level security;
alter table app_private.guest_orders enable row level security;
alter table app_private.api_rate_limits enable row level security;
revoke all on all tables in schema app_private from public,anon,authenticated;
revoke all on schema app_private from public,anon,authenticated;
-- All following functions are invoked server-side with service_role,
-- except the verified-owner admin claim, invoked by authenticated user.

create or replace function public.afrinethub_throttle(p_key text, p_max integer,p_window_seconds integer)
returns boolean language plpgsql volatile security definer set search_path=''
as $$
declare n integer; start_at timestamptz;
begin
 if p_key is null or length(p_key)>180 or length(p_key)<16 or p_max not between 1 and 100 or p_window_seconds not between 60 and 86400 then
   return false;
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(p_key));
 select count,period_start into n,start_at from app_private.api_rate_limits where rate_key=p_key for update;
 if not found then
   insert into app_private.api_rate_limits(rate_key,count,period_start) values(p_key,1,now());
   return true;
 elsif start_at < now() - make_interval(secs=>p_window_seconds) then
   update app_private.api_rate_limits set count=1,period_start=now() where rate_key=p_key;
   return true;
 elsif n>=p_max then
   return false;
 else
   update app_private.api_rate_limits set count=count+1 where rate_key=p_key;
   return true;
 end if;
end;$$;

create or replace function public.afrinethub_create_session(p_hash text,p_ip_hash text)
returns uuid language plpgsql volatile security definer set search_path=''
as $$
declare new_id uuid;
begin
 if p_hash is null or length(p_hash)<>64 or p_ip_hash is null or length(p_ip_hash)<>64 then
   raise exception 'Invalid guest credentials';
 end if;
 insert into app_private.guest_sessions(token_hash,ip_hash) values(p_hash,p_ip_hash) returning id into new_id;
 return new_id;
end;$$;

create or replace function public.afrinethub_check_session(p_hash text)
returns uuid language sql stable security definer set search_path=''
as $$
 select s.id from app_private.guest_sessions s where s.token_hash=p_hash and s.expires_at>now() limit 1;
$$;

create or replace function public.afrinethub_upload_slot(p_session uuid,p_path text,p_filename text,p_content_type text,p_size integer)
returns boolean language plpgsql volatile security definer set search_path=''
as $$
declare n integer;
begin
 if p_path is null or position(p_session::text || '/' in p_path)<>1 or length(p_path)>180
 or p_filename is null or length(p_filename)>180
 or p_content_type not in ('application/pdf','image/jpeg','image/png','image/webp','application/vnd.openxmlformats-officedocument.wordprocessingml.document')
 or p_size not between 1 and 10485760 then return false;end if;
 update app_private.guest_sessions set uploads=uploads+1
 where id=p_session and expires_at>now() and uploads<8 returning uploads into n;
 if n is null then return false;end if;
 insert into app_private.guest_uploads(session_id,path,filename,content_type,size_bytes)
 values(p_session,p_path,p_filename,p_content_type,p_size);
 return true;
end;$$;

create or replace function public.afrinethub_has_upload(p_session uuid,p_path text)
returns boolean language sql stable security definer set search_path=''
as $$
 select exists(select 1 from app_private.guest_uploads u where u.session_id=p_session and u.path=p_path);
$$;

create or replace function public.afrinethub_link_order(p_session uuid,p_order uuid)
returns boolean language plpgsql volatile security definer set search_path=''
as $$
begin
 if not exists(select 1 from app_private.guest_sessions s where s.id=p_session and s.expires_at>now()) then return false;end if;
 insert into app_private.guest_orders(session_id,order_id) values(p_session,p_order);
 return true;
end;$$;

create or replace function public.afrinethub_guest_owns_order(p_session uuid,p_order uuid)
returns boolean language sql stable security definer set search_path=''
as $$
 select exists(select 1 from app_private.guest_orders o where o.session_id=p_session and o.order_id=p_order);
$$;

create or replace function public.afrinethub_turnstile_secret()
returns text language sql stable security definer set search_path=''
as $$
 select decrypted_secret from vault.decrypted_secrets where name='afrinethub_turnstile_secret' limit 1;
$$;

-- Never expose privileged database RPCs directly to visitors.
do $$
declare fn text;
begin
 foreach fn in array array[
 'afrinethub_throttle(text,integer,integer)',
 'afrinethub_create_session(text,text)',
 'afrinethub_check_session(text)',
 'afrinethub_upload_slot(uuid,text,text,text,integer)',
 'afrinethub_has_upload(uuid,text)',
 'afrinethub_link_order(uuid,uuid)',
 'afrinethub_guest_owns_order(uuid,uuid)',
 'afrinethub_turnstile_secret()'
 ] loop
   execute format('revoke all on function public.%s from public,anon,authenticated',fn);
   execute format('grant execute on function public.%s to service_role',fn);
 end loop;
end $$;

-- Only the verified owner can claim an EMPTY admin slot.
-- An anonymous user or a merely unconfirmed signup cannot claim it.
create or replace function public.claim_afrinethub_admin()
returns boolean language plpgsql volatile security definer set search_path=''
as $$
declare verified_owner uuid;
begin
 select u.id into verified_owner from auth.users u
 where u.id=(select auth.uid())
   and lower(u.email)='timilehintallest@gmail.com'
   and u.email_confirmed_at is not null
   and u.is_anonymous is not true;
 if verified_owner is null then return false;end if;
 insert into public.admin_config(id,uid) values('setup',verified_owner) on conflict (id) do nothing;
 return exists(select 1 from public.admin_config a where a.id='setup' and a.uid=verified_owner);
end;$$;
revoke all on function public.claim_afrinethub_admin() from public,anon;
grant execute on function public.claim_afrinethub_admin() to authenticated;

-- All new public submissions should go via the Edge API (captcha+rate limiter).
revoke insert on public.orders,public.portal_requests,public.project_requests,
 public.advert_requests,public.feedback_suggestions from anon,authenticated;
drop policy if exists afrinethub_public_submit_order on public.orders;
drop policy if exists afrinethub_public_submit_portal on public.portal_requests;
drop policy if exists afrinethub_public_submit_project on public.project_requests;
drop policy if exists afrinethub_public_submit_advert on public.advert_requests;
drop policy if exists afrinethub_public_submit_feedback on public.feedback_suggestions;

-- Disable unauthenticated privileged order lookup; dedicated API will check guest ownership.
revoke all on function public.get_order_by_id(uuid) from public,anon,authenticated;

-- Avoid RLS admin escalation; config may only be written by trusted RPC above.
revoke insert,update,delete on public.admin_config from anon,authenticated;
