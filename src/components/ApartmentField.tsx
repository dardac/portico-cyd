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
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-stone-700"
      >
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
        className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-base text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:opacity-60 read-only:bg-stone-50"
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      ) : (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-stone-500">
          {`Formato: piso + número "-" + torre (ej. 11-D)`}
        </p>
      )}
    </div>
  );
}
