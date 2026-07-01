import * as XLSX from "xlsx";

type ExportApartment = {
  code: string;
  census: {
    willStayOvernight: boolean;
    adultCount: number | null;
    childrenCount: number | null;
    occupantNames: string | null;
    hasDisability: boolean | null;
    disabilityType: string | null;
    vehicleCount: number | null;
    petCount: number | null;
  } | null;
  profile: {
    occupation: string;
    infrastructureStatusLabel: string;
    gasPipeStatusLabel: string;
    waterPipeStatusLabel: string;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
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
          Ocupantes: apartment.census?.willStayOvernight
            ? (apartment.census.occupantNames ?? "")
            : "",
          Ocupación:
            apartment.census?.willStayOvernight && apartment.profile?.occupation
              ? apartment.profile.occupation
              : "",
          Discapacidad: apartment.census?.willStayOvernight
            ? apartment.census.hasDisability
              ? "Sí"
              : "No"
            : "",
          "Tipo discapacidad": apartment.census?.willStayOvernight
            ? (apartment.census.disabilityType ?? "")
            : "",
          Vehículos: apartment.census?.willStayOvernight
            ? (apartment.census.vehicleCount ?? "")
            : "",
          Mascotas: apartment.census?.willStayOvernight
            ? (apartment.census.petCount ?? "")
            : "",
          Infraestructura: apartment.profile?.infrastructureStatusLabel ?? "",
          "Tuberías de gas": apartment.profile?.gasPipeStatusLabel ?? "",
          "Tuberías de agua": apartment.profile?.waterPipeStatusLabel ?? "",
          "Contacto emergencia": apartment.profile?.emergencyContactName
            ? `${apartment.profile.emergencyContactName}${apartment.profile.emergencyContactPhone ? ` · ${apartment.profile.emergencyContactPhone}` : ""}`
            : "",
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
    { wch: 32 },
    { wch: 14 },
    { wch: 18 },
    { wch: 10 },
    { wch: 10 },
    { wch: 28 },
    { wch: 18 },
    { wch: 28 },
    { wch: 28 },
    { wch: 24 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Censo");

  XLSX.writeFile(workbook, `censo-${data.censusDate}.xlsx`, {
    compression: true,
  });
}
