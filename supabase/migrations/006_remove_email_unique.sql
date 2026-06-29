-- Permitir el mismo correo y teléfono en varios apartamentos

alter table apartments drop constraint if exists apartments_email_key;
