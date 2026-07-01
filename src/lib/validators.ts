/** Formato estándar: hasta 3 dígitos, guión y letra (ej. 11-D) */
export const MAX_APARTMENT_DIGITS = 3;

/** Máximo para conteos (adultos, niños, vehículos, mascotas, etc.) */
export const MAX_COUNT = 99;

export const MAX_EMAIL_LENGTH = 254;
export const MAX_PHONE_LENGTH = 20;
export const MAX_TEXT_FIELD_LENGTH = 200;
export const MAX_OCCUPANT_NAMES_LENGTH = 400;
export const MAX_SUPPORT_DESCRIPTION_LENGTH = 600;
export const MAX_CONTACT_NAME_LENGTH = 120;
export const MAX_PASSWORD_LENGTH = 128;
export const MAX_USERNAME_LENGTH = 50;
export const MIN_PASSWORD_LENGTH = 8;

export function exceedsMaxLength(value: string, max: number): boolean {
  return value.length > max;
}

const STAFF_USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,49}$/;

export function sanitizeStaffUsernameInput(value: string): string {
  return value.replace(/\s/g, "").toLowerCase().slice(0, MAX_USERNAME_LENGTH);
}

export function isValidStaffUsername(username: string): boolean {
  return STAFF_USERNAME_PATTERN.test(username);
}

export function limitCountInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 2);
}

export function limitOccupantNamesInput(value: string): string {
  return value.slice(0, MAX_OCCUPANT_NAMES_LENGTH);
}

/** Excepciones: NT1-D, PH3-C, etc. */
export const APARTMENT_EXCEPTION_PREFIXES = ["NT", "PH"] as const;

export const APARTMENT_PATTERN =
  /^(?:\d{1,3}|(?:NT|PH)\d{1,3})-[A-Za-z]$/;

export function isValidApartment(value: string): boolean {
  return APARTMENT_PATTERN.test(value.trim().toUpperCase());
}

export function normalizeApartmentCode(value: string): string {
  return value.trim().toUpperCase();
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 11;
}

function limitDigits(digits: string): string {
  return digits.slice(0, MAX_APARTMENT_DIGITS);
}

function formatWithDash(prefix: string, letter: string): string {
  if (!letter) return prefix;
  return `${prefix}-${letter}`;
}

function formatExceptionPrefix(type: "NT" | "PH", digits: string, letter: string): string {
  if (!digits) return type;
  return formatWithDash(`${type}${digits}`, letter);
}

function parseExceptionBody(value: string): string | null {
  for (const prefix of APARTMENT_EXCEPTION_PREFIXES) {
    if (!value.startsWith(prefix)) continue;

    const remainder = value.slice(prefix.length);
    const digitMatch = remainder.match(/^(\d*)([A-Z]?)$/);
    if (!digitMatch) return null;

    const digits = limitDigits(digitMatch[1]);
    const letter = digitMatch[2];
    return formatExceptionPrefix(prefix, digits, letter);
  }

  return null;
}

function isTypingExceptionPrefix(value: string): boolean {
  return /^[NP]/.test(value) && !/^\d/.test(value);
}

function formatPartialExceptionInput(value: string): string {
  const withTower = value.match(/^(NT|PH)(\d{1,3})([A-Z])$/);
  if (withTower) {
    return `${withTower[1]}${withTower[2]}-${withTower[3]}`;
  }

  if (/^(?:N(?:T(?:\d{0,3})?)?|P(?:H(?:\d{0,3})?)?)(?:[A-Z])?$/.test(value)) {
    return value;
  }

  return value.replace(/^[NP]+/, "");
}

export function formatApartmentInput(value: string): string {
  const cleaned = value
    .replace(/[^0-9A-Za-z-]/g, "")
    .toUpperCase()
    .replace(/^-+/, "");

  if (!cleaned) return "";

  if (cleaned.includes("-")) {
    const [rawPrefix, ...rest] = cleaned.split("-");
    const letter = rest.join("").replace(/[^A-Z]/g, "").charAt(0);

    if (rawPrefix.startsWith("NT") || rawPrefix.startsWith("PH")) {
      const type = rawPrefix.startsWith("NT") ? "NT" : "PH";
      const digits = limitDigits(rawPrefix.slice(2).replace(/\D/g, ""));
      return formatExceptionPrefix(type, digits, letter);
    }

    const digits = limitDigits(rawPrefix.replace(/\D/g, ""));
    if (!digits) return "";
    return formatWithDash(digits, letter);
  }

  const exceptionFormatted = parseExceptionBody(cleaned);
  if (exceptionFormatted !== null) return exceptionFormatted;

  if (isTypingExceptionPrefix(cleaned)) {
    return formatPartialExceptionInput(cleaned);
  }

  const match = cleaned.match(/^(\d*)([A-Z]?)$/);
  if (!match) return cleaned;

  const [, rawDigits, letter] = match;
  const digits = limitDigits(rawDigits);
  return formatWithDash(digits, letter);
}
