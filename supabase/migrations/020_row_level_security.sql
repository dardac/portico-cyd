-- RLS de defensa en profundidad: bloquea PostgREST (anon/authenticated) y aplica
-- políticas al rol portico_app usado por la app vía SET LOCAL ROLE en el pooler.
-- Los endpoints públicos de auth siguen usando service_role (bypass RLS).

-- ---------------------------------------------------------------------------
-- Funciones de contexto de sesión (GUC por transacción)
-- ---------------------------------------------------------------------------

create or replace function app_session_type()
returns text
language sql
stable
as $$
  select nullif(current_setting('app.session_type', true), '');
$$;

create or replace function app_apartment_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.apartment_id', true), '')::uuid;
$$;

create or replace function app_admin_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.admin_id', true), '')::uuid;
$$;

create or replace function app_staff_role()
returns text
language sql
stable
as $$
  select nullif(current_setting('app.staff_role', true), '');
$$;

create or replace function app_is_staff()
returns boolean
language sql
stable
as $$
  select app_session_type() = 'admin' and app_admin_id() is not null;
$$;

create or replace function app_is_full_admin()
returns boolean
language sql
stable
as $$
  select app_is_staff() and app_staff_role() = 'admin';
$$;

create or replace function app_has_session()
returns boolean
language sql
stable
as $$
  select app_session_type() in ('resident', 'admin');
$$;

create or replace function app_set_session_context(
  p_session_type text,
  p_apartment_id uuid default null,
  p_admin_id uuid default null,
  p_staff_role text default null
)
returns void
language plpgsql
volatile
set search_path = public
as $$
begin
  perform set_config('app.session_type', coalesce(p_session_type, ''), true);
  perform set_config('app.apartment_id', coalesce(p_apartment_id::text, ''), true);
  perform set_config('app.admin_id', coalesce(p_admin_id::text, ''), true);
  perform set_config('app.staff_role', coalesce(p_staff_role, ''), true);
end;
$$;

revoke all on function app_set_session_context(text, uuid, uuid, text) from public;
grant execute on function app_set_session_context(text, uuid, uuid, text)
  to postgres, service_role;

-- ---------------------------------------------------------------------------
-- Rol de aplicación (sin BYPASSRLS; el pooler usa SET LOCAL ROLE portico_app)
-- ---------------------------------------------------------------------------

do $$
begin
  create role portico_app nologin;
exception
  when duplicate_object then null;
end
$$;

grant usage on schema public to portico_app;
grant select, insert, update, delete on all tables in schema public to portico_app;
grant usage, select on all sequences in schema public to portico_app;
grant execute on function app_set_session_context(text, uuid, uuid, text) to portico_app;
grant portico_app to postgres;

-- ---------------------------------------------------------------------------
-- Bloquear acceso directo vía PostgREST (anon / authenticated)
-- ---------------------------------------------------------------------------

revoke all on table public.towers from anon, authenticated;
revoke all on table public.apartments from anon, authenticated;
revoke all on table public.daily_census from anon, authenticated;
revoke all on table public.daily_apartment_profile from anon, authenticated;
revoke all on table public.admin_users from anon, authenticated;
revoke all on table public.support_board_posts from anon, authenticated;
revoke all on table public.schema_migrations from anon, authenticated;

alter table public.towers enable row level security;
alter table public.apartments enable row level security;
alter table public.daily_census enable row level security;
alter table public.daily_apartment_profile enable row level security;
alter table public.admin_users enable row level security;
alter table public.support_board_posts enable row level security;
alter table public.schema_migrations enable row level security;

-- ---------------------------------------------------------------------------
-- Políticas portico_app — torres y apartamentos
-- ---------------------------------------------------------------------------

drop policy if exists portico_towers_select on public.towers;
create policy portico_towers_select on public.towers
  for select to portico_app
  using (app_has_session());

drop policy if exists portico_apartments_select on public.apartments;
create policy portico_apartments_select on public.apartments
  for select to portico_app
  using (id = app_apartment_id() or app_is_staff());

drop policy if exists portico_apartments_update on public.apartments;
create policy portico_apartments_update on public.apartments
  for update to portico_app
  using (id = app_apartment_id() or app_is_full_admin())
  with check (id = app_apartment_id() or app_is_full_admin());

-- ---------------------------------------------------------------------------
-- Censo y perfil diario — solo el apartamento de la sesión o personal
-- ---------------------------------------------------------------------------

drop policy if exists portico_daily_census_select on public.daily_census;
create policy portico_daily_census_select on public.daily_census
  for select to portico_app
  using (apartment_id = app_apartment_id() or app_is_staff());

drop policy if exists portico_daily_census_insert on public.daily_census;
create policy portico_daily_census_insert on public.daily_census
  for insert to portico_app
  with check (apartment_id = app_apartment_id() or app_is_staff());

drop policy if exists portico_daily_census_update on public.daily_census;
create policy portico_daily_census_update on public.daily_census
  for update to portico_app
  using (apartment_id = app_apartment_id() or app_is_staff())
  with check (apartment_id = app_apartment_id() or app_is_staff());

drop policy if exists portico_daily_profile_select on public.daily_apartment_profile;
create policy portico_daily_profile_select on public.daily_apartment_profile
  for select to portico_app
  using (apartment_id = app_apartment_id() or app_is_staff());

drop policy if exists portico_daily_profile_insert on public.daily_apartment_profile;
create policy portico_daily_profile_insert on public.daily_apartment_profile
  for insert to portico_app
  with check (apartment_id = app_apartment_id() or app_is_staff());

drop policy if exists portico_daily_profile_update on public.daily_apartment_profile;
create policy portico_daily_profile_update on public.daily_apartment_profile
  for update to portico_app
  using (apartment_id = app_apartment_id() or app_is_staff())
  with check (apartment_id = app_apartment_id() or app_is_staff());

-- ---------------------------------------------------------------------------
-- Personal administrativo
-- ---------------------------------------------------------------------------

drop policy if exists portico_admin_users_select on public.admin_users;
create policy portico_admin_users_select on public.admin_users
  for select to portico_app
  using (id = app_admin_id() or app_is_full_admin());

drop policy if exists portico_admin_users_insert on public.admin_users;
create policy portico_admin_users_insert on public.admin_users
  for insert to portico_app
  with check (app_is_full_admin());

drop policy if exists portico_admin_users_update on public.admin_users;
create policy portico_admin_users_update on public.admin_users
  for update to portico_app
  using (app_is_full_admin())
  with check (app_is_full_admin());

-- ---------------------------------------------------------------------------
-- Cartelera de apoyo
-- ---------------------------------------------------------------------------

drop policy if exists portico_support_board_select on public.support_board_posts;
create policy portico_support_board_select on public.support_board_posts
  for select to portico_app
  using (app_has_session());

drop policy if exists portico_support_board_insert on public.support_board_posts;
create policy portico_support_board_insert on public.support_board_posts
  for insert to portico_app
  with check (
    (
      app_session_type() = 'resident'
      and created_by_apartment_id = app_apartment_id()
      and created_by_admin_id is null
    )
    or (
      app_is_staff()
      and created_by_admin_id = app_admin_id()
      and created_by_apartment_id is null
    )
  );

drop policy if exists portico_support_board_update on public.support_board_posts;
create policy portico_support_board_update on public.support_board_posts
  for update to portico_app
  using (
    (created_by_apartment_id = app_apartment_id() and app_session_type() = 'resident')
    or (created_by_admin_id = app_admin_id() and app_is_staff())
    or app_is_full_admin()
  )
  with check (
    (created_by_apartment_id = app_apartment_id() and app_session_type() = 'resident')
    or (created_by_admin_id = app_admin_id() and app_is_staff())
    or app_is_full_admin()
  );
