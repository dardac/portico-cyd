export const SUPPORT_POST_TYPES = ["need", "offer"] as const;
export type SupportPostType = (typeof SUPPORT_POST_TYPES)[number];

export const SUPPORT_CATEGORIES = [
  "potable_water",
  "food",
  "first_aid",
  "power",
  "shelter",
  "other",
] as const;
export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

export const SUPPORT_POST_STATUSES = ["open", "attended", "closed"] as const;
export type SupportPostStatus = (typeof SUPPORT_POST_STATUSES)[number];

export const SUPPORT_POST_TYPE_LABELS: Record<SupportPostType, string> = {
  need: "Necesita ayuda",
  offer: "Ofrece ayuda",
};

export const SUPPORT_CATEGORY_LABELS: Record<SupportCategory, string> = {
  potable_water: "Agua Potable",
  food: "Alimentos",
  first_aid: "Primeros Auxilios",
  power: "Luz / Energía / Pilas",
  shelter: "Refugio",
  other: "Otros",
};

export const SUPPORT_POST_STATUS_LABELS: Record<SupportPostStatus, string> = {
  open: "Activa",
  attended: "Ayuda atendida",
  closed: "Cerrada por el autor",
};

export function isSupportPostType(value: string): value is SupportPostType {
  return SUPPORT_POST_TYPES.includes(value as SupportPostType);
}

export function isSupportCategory(value: string): value is SupportCategory {
  return SUPPORT_CATEGORIES.includes(value as SupportCategory);
}
