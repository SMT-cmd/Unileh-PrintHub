-- Exactly two Afrinet Hub administrators, both using individual, verified Supabase Auth identities.
-- No passwords are created or stored in application tables.
-- Restricted to this dedicated project, not any Global Webstores database.
alter table public.admin_config drop constraint if exists singleton_admin;
alter table public.admin_config
  add constraint afrinethub_exactly_two_approved_slots
  check (id in ('setup', 'brother'));
comment on table public.admin_config is
 'At most two administrators: setup = timilehintallest@gmail.com, brother = afrinetnig@gmail.com. Each has a distinct confirmed Supabase Auth user.';

-- All admin CRUD policies already use this stable predicate.
create or replace function app_private.is_afrinethub_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
 select exists (
   select 1 from public.admin_config a
   where a.uid = (select auth.uid())
     and (select auth.uid()) is not null
 );
$$;
revoke all on function app_private.is_afrinethub_admin() from public, anon;
grant execute on function app_private.is_afrinethub_admin() to authenticated;

-- A verified owner can claim ONLY their named slot.
-- A verified brother can claim ONLY his named slot.
-- The primary owner and brother must never share a password.
create or replace function public.claim_afrinethub_admin()
returns boolean
language plpgsql volatile security definer
set search_path = ''
as $$
declare
 verified_uid uuid;
 verified_email text;
 allowed_slot text;
begin
 select u.id, lower(pg_catalog.btrim(u.email))
   into verified_uid, verified_email
 from auth.users u
 where u.id = (select auth.uid())
   and u.email_confirmed_at is not null
   and u.is_anonymous is not true;

 if verified_uid is null then return false; end if;

 allowed_slot := case verified_email
   when 'timilehintallest@gmail.com' then 'setup'
   when 'afrinetnig@gmail.com' then 'brother'
   else null
 end;
 if allowed_slot is null then return false; end if;

 -- This cannot assign an occupied slot to a second identity.
 insert into public.admin_config(id, uid)
 values (allowed_slot, verified_uid)
 on conflict (id) do nothing;

 return exists (
   select 1 from public.admin_config a
   where a.id = allowed_slot and a.uid = verified_uid
 );
end;
$$;
revoke all on function public.claim_afrinethub_admin() from public, anon;
grant execute on function public.claim_afrinethub_admin() to authenticated;
