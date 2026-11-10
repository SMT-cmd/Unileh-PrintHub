-- Service-only access to the verified Resend sending key in encrypted Supabase Vault.
create or replace function public.afrinethub_staff_email_secret()
returns text language sql stable security definer set search_path=''
as $$
 select decrypted_secret from vault.decrypted_secrets
 where name='afrinethub_resend_staff_key' limit 1;
$$;
revoke all on function public.afrinethub_staff_email_secret() from public,anon,authenticated;
grant execute on function public.afrinethub_staff_email_secret() to service_role;
