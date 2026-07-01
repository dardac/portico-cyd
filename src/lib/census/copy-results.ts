import { formatCensusPeople } from "@/lib/census/format-people";

type CensusApartment = {
  code: string;
  census: {
    willStayOvernight: boolean;
    adultCount: number | null;
    childrenCount: number | null;
  } | null;
};

type TowerData = {
  code: string;
  floors: Array<{
    apartments: CensusApartment[];
  }>;
};

type CensusCopyData = {
  censusDate: string;
  towers: TowerData[];
};

export function formatCensusDateForCopy(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

export function buildCensusCopyText(data: CensusCopyData): string {
  const lines: string[] = [
    `Registro del día ${formatCensusDateForCopy(data.censusDate)}:`,
  ];

  let hasAny = false;

  for (const tower of data.towers) {
    const staying = tower.floors
      .flatMap((floor) => floor.apartments)
      .filter((apartment) => apartment.census?.willStayOvernight)
      .sort((a, b) => a.code.localeCompare(b.code, "es", { numeric: true }));

    if (staying.length === 0) continue;

    if (hasAny) lines.push("");
    hasAny = true;

    lines.push(`Torre ${tower.code}:`);

    for (const apartment of staying) {
      const summary = formatCensusPeople({
        adultCount: apartment.census!.adultCount ?? 0,
        childrenCount: apartment.census!.childrenCount ?? 0,
      });
      lines.push(`${apartment.code}: ${summary}`);
    }
  }

  if (!hasAny) {
    lines.push("", "Ningún apartamento registró pernocta este día.");
  }

  return lines.join("\n");
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      return document.execCommand("copy");
    } finally {
      document.body.removeChild(textarea);
    }
  }
}
