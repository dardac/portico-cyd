-- Usuarios administradores (registrar manualmente en la BD)

create table admin_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on table public.admin_users to service_role;

-- Ejemplo (cambiar contraseña antes de producción):
-- insert into admin_users (username, password_hash)
-- values ('admin', crypt('tu-contraseña', gen_salt('bf', 10)));
