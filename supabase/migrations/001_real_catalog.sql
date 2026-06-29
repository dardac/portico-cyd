-- Migración para proyectos con el esquema anterior (256 aptos., 16 pisos).
-- Idempotente: seguro volver a ejecutar si ya se aplicó parcialmente.

alter table apartments drop constraint if exists apartments_floor_check;
alter table apartments drop constraint if exists apartments_tower_id_floor_unit_key;

alter table apartments
  add column if not exists apartment_type text not null default 'standard';

alter table apartments
  drop constraint if exists apartments_apartment_type_check;

alter table apartments
  add constraint apartments_apartment_type_check
  check (apartment_type in ('standard', 'nt', 'ph'));

alter table apartments alter column floor drop not null;

alter table apartments
  drop constraint if exists apartments_catalog_check;

alter table apartments
  add constraint apartments_catalog_check
  check (
    (apartment_type = 'standard' and floor between 1 and 14 and unit between 1 and 8)
    or (apartment_type in ('nt', 'ph') and floor is null and unit between 1 and 4)
  );

alter table towers alter column floors set default 14;

update towers set floors = 14, units_per_floor = 8 where code in ('C', 'D');

create unique index if not exists apartments_standard_unique_idx
  on apartments (tower_id, floor, unit)
  where apartment_type = 'standard';

create unique index if not exists apartments_exception_unique_idx
  on apartments (tower_id, apartment_type, unit)
  where apartment_type in ('nt', 'ph');
