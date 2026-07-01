export const INFRASTRUCTURE_STATUS_VALUES = [
  "none",
  "minor_cracks",
  "severe_damage",
  "uninhabitable",
] as const;

export type InfrastructureStatus = (typeof INFRASTRUCTURE_STATUS_VALUES)[number];

export const INFRASTRUCTURE_STATUS_OPTIONS: Array<{
  value: InfrastructureStatus;
  label: string;
  description: string;
}> = [
  {
    value: "none",
    label: "Sin Daños",
    description:
      "Estructura en perfecto estado o daños estéticos nulos.",
  },
  {
    value: "minor_cracks",
    label: "Grietas Leves",
    description:
      "Fisuras pequeñas en pintura o yeso, no estructural.",
  },
  {
    value: "severe_damage",
    label: "Daño Severo",
    description:
      "Grietas profundas en columnas, vigas o paredes de carga.",
  },
  {
    value: "uninhabitable",
    label: "Inhabitable / Peligro",
    description:
      "Colapso parcial, derrumbes internos o riesgo inminente.",
  },
];

export function isValidInfrastructureStatus(
  value: string,
): value is InfrastructureStatus {
  return INFRASTRUCTURE_STATUS_VALUES.includes(value as InfrastructureStatus);
}

export function getInfrastructureStatusLabel(
  value: InfrastructureStatus | null | undefined,
): string {
  if (!value) return "Sin registrar";
  return (
    INFRASTRUCTURE_STATUS_OPTIONS.find((option) => option.value === value)
      ?.label ?? "Sin registrar"
  );
}
