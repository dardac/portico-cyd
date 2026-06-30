-- Datos del apartamento por día (ocupación, discapacidad, vehículos, mascotas)

create table daily_apartment_profile (
  id uuid primary key default gen_random_uuid(),
  apartment_id uuid not null references apartments (id) on delete cascade,
  profile_date date not null,
  occupation text not null,
  has_disability boolean not null,
  disability_type text,
  vehicle_count smallint not null default 0
    check (vehicle_count >= 0 and vehicle_count <= 999),
  pet_count smallint not null default 0
    check (pet_count >= 0 and pet_count <= 999),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (apartment_id, profile_date),
  check (
    (has_disability = false and disability_type is null)
    or (
      has_disability = true
      and disability_type is not null
      and length(trim(disability_type)) > 0
    )
  )
);

create index daily_apartment_profile_date_idx
  on daily_apartment_profile (profile_date);

create index daily_apartment_profile_apartment_date_idx
  on daily_apartment_profile (apartment_id, profile_date);

insert into daily_apartment_profile (
  apartment_id,
  profile_date,
  occupation,
  has_disability,
  disability_type,
  vehicle_count,
  pet_count,
  updated_at
)
select
  id,
  coalesce((profile_updated_at at time zone 'America/Caracas')::date, current_date),
  occupation,
  has_disability,
  disability_type,
  coalesce(vehicle_count, 0),
  coalesce(pet_count, 0),
  profile_updated_at
from apartments
where profile_updated_at is not null
  and occupation is not null
  and has_disability is not null;

alter table apartments
  drop column if exists occupation,
  drop column if exists has_disability,
  drop column if exists disability_type,
  drop column if exists vehicle_count,
  drop column if exists pet_count,
  drop column if exists profile_updated_at;

grant select, insert, update, delete on table public.daily_apartment_profile to service_role;
