import {
  PIPE_STATUS_OPTIONS,
  type PipeStatus,
} from "@/lib/apartment/pipe-status";

type PipeStatusSelectorProps = {
  legend: string;
  name: string;
  value: PipeStatus | null;
  onChange: (value: PipeStatus) => void;
};

export function PipeStatusSelector({
  legend,
  name,
  value,
  onChange,
}: PipeStatusSelectorProps) {
  return (
    <fieldset>
      <legend className="field-label mb-3">{legend}</legend>
      <div className="infrastructure-grid">
        {PIPE_STATUS_OPTIONS.map((option) => {
          const isSelected = value === option.value;
          const needsAttention =
            option.value === "pending_repair" ||
            option.value === "pending_review";

          return (
            <label
              key={option.value}
              className={[
                "infrastructure-option",
                isSelected && "infrastructure-option-selected",
                isSelected &&
                  needsAttention &&
                  "infrastructure-option-risk",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <input
                type="radio"
                name={name}
                className="sr-only"
                checked={isSelected}
                onChange={() => onChange(option.value)}
              />
              <span
                className="infrastructure-option-indicator"
                aria-hidden="true"
              >
                {isSelected && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="h-3 w-3"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </span>
              <span className="infrastructure-option-body">
                <span className="infrastructure-option-title">
                  {option.label}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
