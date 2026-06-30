import * as XLSX from "xlsx";

type ExportApartment = {
  code: string;
  census: {
    willStayOvernight: boolean;
    adultCount: number | null;
    childrenCount: number | null;
  } | null;
  profile: {
    occupation: string;
    hasDisability: boolean;
    disabilityType: string | null;
    vehicleCount: number;
    petCount: number;
  } | null;
};

type ExportTower = {
  code: string;
  floors: Array<{
    label: string;
    apartments: ExportApartment[];
  }>;
};

export type CensusExportData = {
  censusDate: string;
  towers: ExportTower[];
};

function flattenApartments(data: CensusExportData) {
  const rows: Record<string, string | number>[] = [];

  for (const tower of data.towers) {
    for (const floor of tower.floors) {
      for (const apartment of floor.apartments) {
        rows.push({
          Torre: tower.code,
          Piso: floor.label,
          Apartamento: apartment.code,
          "Censo respondido": apartment.census ? "Sí" : "No",
          Pernocta: apartment.census
            ? apartment.census.willStayOvernight
              ? "Sí"
              : "No"
            : "",
          Adultos: apartment.census?.willStayOvernight
            ? (apartment.census.adultCount ?? "")
            : "",
          "Niños/adolescentes": apartment.census?.willStayOvernight
            ? (apartment.census.childrenCount ?? "")
            : "",
          Ocupación: apartment.profile?.occupation ?? "",
          Discapacidad: apartment.profile
            ? apartment.profile.hasDisability
              ? "Sí"
              : "No"
            : "",
          "Tipo discapacidad": apartment.profile?.disabilityType ?? "",
          Vehículos: apartment.profile?.vehicleCount ?? "",
          Mascotas: apartment.profile?.petCount ?? "",
        });
      }
    }
  }

  return rows;
}

export function downloadCensusExcel(data: CensusExportData) {
  const rows = flattenApartments(data);
  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 10 },
    { wch: 12 },
    { wch: 16 },
    { wch: 10 },
    { wch: 10 },
    { wch: 18 },
    { wch: 28 },
    { wch: 14 },
    { wch: 18 },
    { wch: 10 },
    { wch: 10 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Censo");

  XLSX.writeFile(workbook, `censo-${data.censusDate}.xlsx`, {
    compression: true,
  });
}
