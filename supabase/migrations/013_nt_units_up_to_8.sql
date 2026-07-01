-- NT1–NT8 por torre (PH sigue siendo PH1–PH4)

alter table apartments drop constraint if exists apartments_catalog_check;

alter table apartments
  add constraint apartments_catalog_check
  check (
    (apartment_type = 'standard' and floor between 1 and 14 and unit between 1 and 8)
    or (apartment_type = 'nt' and floor is null and unit between 1 and 8)
    or (apartment_type = 'ph' and floor is null and unit between 1 and 4)
  );

insert into apartments (tower_id, apartment_type, floor, unit, code, password_hash)
select
  t.id,
  'nt',
  null,
  u.unit,
  'NT' || u.unit::text || '-' || t.code,
  crypt('portico2026', gen_salt('bf', 10))
from towers t
cross join generate_series(5, 8) as u (unit)
on conflict (code) do nothing;
