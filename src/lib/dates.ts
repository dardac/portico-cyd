const CARACAS_TIMEZONE = "America/Caracas";

export function getTodayInCaracas(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CARACAS_TIMEZONE,
  }).format(new Date());
}

export function getYesterdayInCaracas(): string {
  const [year, month, day] = getTodayInCaracas().split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function formatDateInCaracas(
  date: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  },
): string {
  const [year, month, day] = date.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  return new Intl.DateTimeFormat("es-VE", {
    timeZone: CARACAS_TIMEZONE,
    ...options,
  }).format(utcDate);
}
