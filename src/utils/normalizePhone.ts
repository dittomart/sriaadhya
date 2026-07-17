export const PHONE_COUNTRY_CODE = '+91';

/** The only place a country code is prepended. Never inline `+91` elsewhere. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  return `${PHONE_COUNTRY_CODE}${digits}`;
}

/** Display form used across the app: "+91 9876543210". */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const local = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;
  return `${PHONE_COUNTRY_CODE} ${local}`;
}

export function isValidPhone(raw: string): boolean {
  return /^\d{10}$/.test(raw.trim());
}
