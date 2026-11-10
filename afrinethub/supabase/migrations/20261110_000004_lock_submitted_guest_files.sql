-- Dedicated Afrinet Hub only. After checkout, uploaded files must remain immutable.
create or replace function public.afrinethub_guest_has_order(p_session uuid)
returns boolean language sql stable security definer set search_path=''
as $$
 select exists(select 1 from app_private.guest_orders where session_id=p_session);
$$;
revoke all on function public.afrinethub_guest_has_order(uuid) from public,anon,authenticated;
grant execute on function public.afrinethub_guest_has_order(uuid) to service_role;
