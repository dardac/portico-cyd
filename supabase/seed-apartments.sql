-- Pórtico del Ávila — Carga del catálogo real de apartamentos
-- Ejecutar con: npm run db:seed
-- (Aplica migraciones antes con: npm run db:migrate)
--
-- Total: 248 apartamentos
--   NT1–NT8 × torres C y D  →  16
--   PH1–PH4 × torres C y D  →  8
--   Pisos 1–14, unidades 1–8 × torres C y D  →  224
--
-- Contraseña inicial de todos: portico2026

-- Torres (por si aún no existen)
insert into towers (code, name, floors, units_per_floor) values
  ('C', 'Torre C', 14, 8),
  ('D', 'Torre D', 14, 8)
on conflict (code) do update set
  name = excluded.name,
  floors = excluded.floors,
  units_per_floor = excluded.units_per_floor;

-- Limpiar catálogo anterior
delete from apartments;

-- ---------------------------------------------------------------------------
-- Excepciones NT (16)
-- ---------------------------------------------------------------------------

insert into apartments (tower_id, apartment_type, floor, unit, code, password_hash)
select
  t.id,
  'nt',
  null,
  u.unit,
  'NT' || u.unit::text || '-' || t.code,
  crypt('portico2026', gen_salt('bf', 10))
from towers t
cross join generate_series(1, 8) as u (unit);

-- ---------------------------------------------------------------------------
-- Excepciones PH (8)
-- ---------------------------------------------------------------------------

insert into apartments (tower_id, apartment_type, floor, unit, code, password_hash)
select
  t.id,
  'ph',
  null,
  u.unit,
  'PH' || u.unit::text || '-' || t.code,
  crypt('portico2026', gen_salt('bf', 10))
from towers t
cross join generate_series(1, 4) as u (unit);

-- ---------------------------------------------------------------------------
-- Estándar: pisos 1–14, unidades 1–8 (224)
-- Código = piso || unidad, guión, torre
-- Ejemplo: piso 1, unidad 1 → 11-D | piso 10, unidad 6 → 106-C
-- ---------------------------------------------------------------------------

insert into apartments (tower_id, apartment_type, floor, unit, code, password_hash)
select
  t.id,
  'standard',
  f.floor,
  u.unit,
  f.floor::text || u.unit::text || '-' || t.code,
  crypt('portico2026', gen_salt('bf', 10))
from towers t
cross join generate_series(1, 14) as f (floor)
cross join generate_series(1, 8) as u (unit);
