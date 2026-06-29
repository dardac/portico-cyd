-- Campos de registro por apartamento

alter table apartments
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists registered_at timestamptz;
