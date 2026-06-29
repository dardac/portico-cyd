type ApartmentFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  readOnly?: boolean;
};

export function ApartmentField({
  id,
  value,
  onChange,
  error,
  disabled = false,
  readOnly = false,
}: ApartmentFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        Apartamento
      </label>
      <input
        id={id}
        name="apartment"
        type="text"
        inputMode="text"
        autoComplete="username"
        placeholder="11-D, NT1-D, PH3-C"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : `${id}-hint`}
        className="field-input read-only:bg-stone-50"
      />
      {error ? (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      ) : (
        <p id={`${id}-hint`} className="field-hint">
          Formato: piso + número &quot;-&quot; + torre (ej. 11-D)
        </p>
      )}
    </div>
  );
}
