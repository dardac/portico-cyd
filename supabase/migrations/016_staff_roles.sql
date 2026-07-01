-- Roles de personal: admin (acceso completo) y vigilante (restricciones futuras)

alter table admin_users
  add column if not exists role text not null default 'admin';

alter table admin_users
  drop constraint if exists admin_users_role_check;

alter table admin_users
  add constraint admin_users_role_check
  check (role in ('admin', 'vigilante'));
