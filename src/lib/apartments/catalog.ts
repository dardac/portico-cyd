export type TowerCode = "C" | "D";
export type ApartmentType = "standard" | "nt" | "ph";

export interface ApartmentRecord {
  code: string;
  tower: TowerCode;
  type: ApartmentType;
  floor: number | null;
  unit: number;
}

export const TOWERS: TowerCode[] = ["C", "D"];
export const STANDARD_FLOORS = 14;
export const UNITS_PER_FLOOR = 8;
export const EXCEPTION_UNITS = [1, 2, 3, 4] as const;

/** Código visible del apartamento estándar: piso + unidad (ej. piso 1, unidad 1 → 11) */
export function standardApartmentCode(floor: number, unit: number): string {
  return `${floor}${unit}`;
}

export function buildApartmentCatalog(): ApartmentRecord[] {
  const apartments: ApartmentRecord[] = [];

  for (const tower of TOWERS) {
    for (const unit of EXCEPTION_UNITS) {
      apartments.push({
        code: `NT${unit}-${tower}`,
        tower,
        type: "nt",
        floor: null,
        unit,
      });
      apartments.push({
        code: `PH${unit}-${tower}`,
        tower,
        type: "ph",
        floor: null,
        unit,
      });
    }
  }

  for (const tower of TOWERS) {
    for (let floor = 1; floor <= STANDARD_FLOORS; floor++) {
      for (let unit = 1; unit <= UNITS_PER_FLOOR; unit++) {
        const code = standardApartmentCode(floor, unit);
        apartments.push({
          code: `${code}-${tower}`,
          tower,
          type: "standard",
          floor,
          unit,
        });
      }
    }
  }

  return apartments;
}

export const APARTMENT_CATALOG = buildApartmentCatalog();

export const APARTMENT_COUNT = APARTMENT_CATALOG.length;
