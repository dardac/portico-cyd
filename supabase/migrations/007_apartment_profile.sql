-- Datos del apartamento (no ligados al censo diario)

alter table apartments
  add column if not exists occupation text,
  add column if not exists has_disability boolean,
  add column if not exists vehicle_count smallint,
  add column if not exists pet_count smallint,
  add column if not exists profile_updated_at timestamptz;

alter table apartments
  drop constraint if exists apartments_vehicle_count_check;

alter table apartments
  drop constraint if exists apartments_pet_count_check;

alter table apartments
  add constraint apartments_vehicle_count_check
  check (vehicle_count is null or (vehicle_count >= 0 and vehicle_count <= 999));

alter table apartments
  add constraint apartments_pet_count_check
  check (pet_count is null or (pet_count >= 0 and pet_count <= 999));

grant select, update on table public.apartments to service_role;
