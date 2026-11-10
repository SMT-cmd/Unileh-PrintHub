-- Dedicated Afrinet Hub: two full administrators plus restricted invited print operators.
-- Only afrinetnig@gmail.com can manage invitations. Printer permissions never expose finance data.
create table if not exists public.print_staff (
  email text primary key,
  uid uuid unique references auth.users(id) on delete set null,
  invited_by uuid not null references auth.users(id) on delete restrict,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  joined_at timestamptz,
  constraint print_staff_valid_email check (
    email = lower(btrim(email))
    and char_length(email) between 6 and 254
    and email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);
alter table public.print_staff enable row level security;
revoke all on public.print_staff from public, anon, authenticated;
grant select on public.print_staff to authenticated;
create policy print_staff_own_membership on public.print_staff for select to authenticated
using (active and uid = (select auth.uid()));

-- Verified invite acceptance: address matching an active invitation is the only way
-- to claim print access; arbitrary signups have no privilege.
create or replace function public.claim_print_staff()
returns boolean language plpgsql volatile security definer set search_path=''
as $$
declare verified_uid uuid; verified_email text;
begin
 select u.id, lower(btrim(u.email)) into verified_uid, verified_email
 from auth.users u
 where u.id = (select auth.uid())
   and u.email_confirmed_at is not null
   and u.is_anonymous is not true;
 if verified_uid is null then return false; end if;
 update public.print_staff set uid=verified_uid,
   joined_at=coalesce(joined_at,now())
 where email=verified_email and active
   and (uid is null or uid=verified_uid);
 return exists(select 1 from public.print_staff s
  where s.email=verified_email and s.active and s.uid=verified_uid);
end $$;
revoke all on function public.claim_print_staff() from public, anon;
grant execute on function public.claim_print_staff() to authenticated;

-- Service-only functions receive actor UUID from a JWT already verified by
-- the trusted Edge endpoint; never trust an actor ID sent by the browser.
create or replace function public.afrinethub_print_jobs(p_actor uuid)
returns jsonb language sql stable security definer set search_path=''
as $$
 select coalesce(jsonb_agg(jsonb_build_object(
  'id',o.id,'orderNumber',o.order_number,'status',o.status,'createdAt',o.created_at,
  'studentName',o.data->>'studentName','phoneNumber',o.data->>'phoneNumber',
  'files',coalesce((
     select jsonb_agg(jsonb_build_object(
       'fileId',f->>'fileId','fileName',f->>'fileName',
       'pageCount',f->>'pageCount','copies',f->>'copies',
       'printType',f->>'printType'))
     from jsonb_array_elements(
       case when jsonb_typeof(o.data->'items')='array'
         then o.data->'items'
         else jsonb_build_array(jsonb_build_object(
           'fileId',o.data->>'fileId','fileName',o.data->>'fileName',
           'pageCount',o.data->>'pageCount','copies',o.data->>'copies',
           'printType',o.data->>'printType'))
       end
     ) f
   ),'[]'::jsonb)
 )),'[]'::jsonb)
 from (
  select * from public.orders o where o.status in ('Paid','Printed','Ready','Collected')
  order by o.created_at desc limit 100
 ) o
 where exists(select 1 from public.print_staff s
   where s.uid=p_actor and s.active)
    or exists(select 1 from public.admin_config a where a.uid=p_actor);
$$;

create or replace function public.afrinethub_print_update(
 p_actor uuid,p_order uuid,p_next_status text
) returns boolean language plpgsql volatile security definer set search_path=''
as $$
declare old_status text;
begin
 if not exists(select 1 from public.print_staff s where s.uid=p_actor and s.active)
    and not exists(select 1 from public.admin_config a where a.uid=p_actor)
 then return false;end if;
 select status into old_status from public.orders where id=p_order for update;
 if old_status is null then return false;end if;
 if not ((old_status='Paid' and p_next_status='Printed')
   or (old_status='Printed' and p_next_status='Ready')
   or (old_status='Ready' and p_next_status='Collected'))
 then return false;end if;
 update public.orders set status=p_next_status where id=p_order and status=old_status;
 return found;
end $$;

create or replace function public.afrinethub_print_file_allowed(
 p_actor uuid,p_path text
) returns boolean language sql stable security definer set search_path=''
as $$
 select exists (
   select 1 from public.orders o
   where o.status in ('Paid','Printed','Ready','Collected')
     and (o.data->>'fileId'=p_path or exists (
       select 1 from jsonb_array_elements(
         case when jsonb_typeof(o.data->'items')='array'
           then o.data->'items' else '[]'::jsonb end
       ) it where it->>'fileId'=p_path))
     and (exists(select 1 from public.print_staff s where s.uid=p_actor and s.active)
        or exists(select 1 from public.admin_config a where a.uid=p_actor))
 );
$$;

do $$
declare f text;
begin
 foreach f in array array[
  'afrinethub_print_jobs(uuid)',
  'afrinethub_print_update(uuid,uuid,text)',
  'afrinethub_print_file_allowed(uuid,text)'
 ] loop
  execute format('revoke all on function public.%s from public, anon, authenticated',f);
  execute format('grant execute on function public.%s to service_role',f);
 end loop;
end $$;

-- Explicit denial: print_staff never receives orders SELECT/UPDATE grants,
-- neither payment verification nor finance/adverts/customer-request access.
