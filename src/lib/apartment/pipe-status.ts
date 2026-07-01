export const PIPE_STATUS_VALUES = [
  "ok",
  "pending_review",
  "pending_repair",
  "repaired",
] as const;

export type PipeStatus = (typeof PIPE_STATUS_VALUES)[number];

export const PIPE_STATUS_OPTIONS: Array<{
  value: PipeStatus;
  label: string;
}> = [
  { value: "ok", label: "Todo en orden, sin novedades" },
  { value: "pending_review", label: "En espera por revisión" },
  { value: "pending_repair", label: "Averías pendientes por reparar" },
  { value: "repaired", label: "Averías reparadas" },
];

export function isValidPipeStatus(value: string): value is PipeStatus {
  return PIPE_STATUS_VALUES.includes(value as PipeStatus);
}

export function getPipeStatusLabel(
  value: PipeStatus | null | undefined,
): string {
  if (!value) return "Sin registrar";
  return (
    PIPE_STATUS_OPTIONS.find((option) => option.value === value)?.label ??
    "Sin registrar"
  );
}
