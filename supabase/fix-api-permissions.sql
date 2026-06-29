-- Si npm run db:migrate no conecta, pega esto en Supabase → SQL Editor
-- Corrige "permission denied" en la API

grant usage on schema public to postgres, anon, authenticated, service_role;

grant select, insert, update, delete on table public.towers to anon, authenticated, service_role;
grant select, insert, update, delete on table public.apartments to anon, authenticated, service_role;

grant all on table public.towers to service_role;
grant all on table public.apartments to service_role;

alter table public.towers disable row level security;
alter table public.apartments disable row level security;

grant select, insert, update, delete on table public.daily_census to service_role;
grant select, insert, update, delete on table public.admin_users to service_role;
