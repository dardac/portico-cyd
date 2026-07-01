-- Contacto de emergencia en el perfil diario del apartamento

alter table daily_apartment_profile
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text;
