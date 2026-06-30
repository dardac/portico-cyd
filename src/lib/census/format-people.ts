export type CensusPeopleCounts = {
  adultCount: number;
  childrenCount: number;
};

export function getCensusPeopleTotal(counts: CensusPeopleCounts): number {
  return counts.adultCount + counts.childrenCount;
}

export function formatCensusPeople(counts: CensusPeopleCounts): string {
  const parts: string[] = [];

  if (counts.adultCount > 0) {
    parts.push(
      `${counts.adultCount} ${counts.adultCount === 1 ? "adulto" : "adultos"}`,
    );
  }

  if (counts.childrenCount > 0) {
    parts.push(
      `${counts.childrenCount} ${
        counts.childrenCount === 1 ? "niño/adolescente" : "niños/adolescentes"
      }`,
    );
  }

  return parts.join(", ");
}
