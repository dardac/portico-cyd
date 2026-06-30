-- Censo: adultos y niños/adolescentes en lugar de un solo conteo

alter table daily_census
  add column if not exists adult_count smallint,
  add column if not exists children_count smallint;

update daily_census
set
  adult_count = people_count,
  children_count = 0
where will_stay_overnight = true
  and people_count is not null;

alter table daily_census
  drop constraint if exists daily_census_check;

alter table daily_census
  drop column if exists people_count;

alter table daily_census
  add constraint daily_census_people_check
  check (
    (
      will_stay_overnight = false
      and adult_count is null
      and children_count is null
    )
    or (
      will_stay_overnight = true
      and adult_count is not null
      and children_count is not null
      and adult_count >= 0
      and children_count >= 0
      and adult_count <= 999
      and children_count <= 999
      and adult_count + children_count >= 1
    )
  );
