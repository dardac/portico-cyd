-- Correo y teléfono del personal administrativo

alter table admin_users
  add column if not exists email text,
  add column if not exists phone text;
