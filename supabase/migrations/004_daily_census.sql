-- Censo diario: una respuesta por apartamento por día

create table daily_census (
  id uuid primary key default gen_random_uuid(),
  apartment_id uuid not null references apartments (id) on delete cascade,
  census_date date not null,
  will_stay_overnight boolean not null,
  people_count smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (apartment_id, census_date),
  check (
    (will_stay_overnight = false and people_count is null)
    or (will_stay_overnight = true and people_count >= 1)
  )
);

create index daily_census_date_idx on daily_census (census_date);
create index daily_census_apartment_date_idx on daily_census (apartment_id, census_date);

grant select, insert, update, delete on table public.daily_census to service_role;
