-- Dedicated Afrinet Hub Supabase project.
-- Mirrors the already applied server-side permission migration.
grant execute on function public.generate_order_number() to service_role;
