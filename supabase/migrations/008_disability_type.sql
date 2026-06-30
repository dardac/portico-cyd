-- Tipo de discapacidad (cuando has_disability = true)

alter table apartments
  add column if not exists disability_type text;
