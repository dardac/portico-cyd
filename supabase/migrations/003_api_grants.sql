-- Permisos para que la API de Supabase (PostgREST) pueda leer/escribir las tablas

grant usage on schema public to postgres, anon, authenticated, service_role;

grant select, insert, update, delete on table public.towers to anon, authenticated, service_role;
grant select, insert, update, delete on table public.apartments to anon, authenticated, service_role;

grant all on table public.towers to service_role;
grant all on table public.apartments to service_role;

grant select, insert, update, delete on table public.schema_migrations to service_role;

alter table public.towers disable row level security;
alter table public.apartments disable row level security;
