-- Estado de tuberías de gas y agua en el perfil diario del apartamento

alter table daily_apartment_profile
  add column if not exists gas_pipe_status text,
  add column if not exists water_pipe_status text;

alter table daily_apartment_profile
  drop constraint if exists daily_apartment_profile_gas_pipe_status_check;

alter table daily_apartment_profile
  add constraint daily_apartment_profile_gas_pipe_status_check
  check (
    gas_pipe_status is null
    or gas_pipe_status in (
      'ok',
      'pending_review',
      'pending_repair',
      'repaired'
    )
  );

alter table daily_apartment_profile
  drop constraint if exists daily_apartment_profile_water_pipe_status_check;

alter table daily_apartment_profile
  add constraint daily_apartment_profile_water_pipe_status_check
  check (
    water_pipe_status is null
    or water_pipe_status in (
      'ok',
      'pending_review',
      'pending_repair',
      'repaired'
    )
  );
