/**
 * Precise financial and BRL parsing utilities.
 * Handles currencies in both decimal Reais and exact integer cents to eliminate floating-point drift.
 */

/**
 * Parses user-entered currency strings into a valid number (in Reais).
 * Accurately accepts formats such as:
 * - "1.500,50" (Brazilian standard with dot for thousands)
 * - "1500,50" (comma as decimal separator)
 * - "1500.50" (dot as decimal separator)
 * - "1,500.50" (international format)
 * - "R$ 1.250,90"
 */
export function parseBRL(input: string | number | null | undefined): number {
  if (input === null || input === undefined) return 0;
  if (typeof input === 'number') {
    return isNaN(input) ? 0 : roundMoney(input);
  }

  const raw = input.trim();
  if (!raw) return 0;

  // Clean currency symbols, spaces, and signs
  let cleaned = raw
    .replace(/[R$\s\u00A0]/gi, '')
    .trim();

  if (!cleaned) return 0;

  // Determine decimal separator
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) {
      // "1.500,50" -> dot is thousand separator, comma is decimal
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // "1,500.50" -> comma is thousand separator, dot is decimal
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (lastComma > -1) {
    // "1500,50"
    cleaned = cleaned.replace(',', '.');
  }

  // Remove any remaining invalid characters except dot and digits and leading minus
  cleaned = cleaned.replace(/[^0-9.-]/g, '');

  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;

  return roundMoney(parsed);
}

/**
 * Converts a Real amount into exact integer cents
 */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Converts integer cents back into a Real amount rounded to 2 decimals
 */
export function fromCents(cents: number): number {
  return Math.round(cents) / 100;
}

/**
 * Rounds any financial value to exactly 2 decimal places
 */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Safe financial addition in cents
 */
export function addMoney(a: number, b: number): number {
  return fromCents(toCents(a) + toCents(b));
}

/**
 * Safe financial subtraction in cents
 */
export function subtractMoney(a: number, b: number): number {
  return fromCents(toCents(a) - toCents(b));
}

/**
 * Safe financial multiplication
 */
export function multiplyMoney(amount: number, factor: number): number {
  return fromCents(Math.round(toCents(amount) * factor));
}

/**
 * Safe financial division (e.g. for installments)
 */
export function divideMoney(amount: number, divisor: number): number {
  if (!divisor || divisor === 0) return 0;
  return fromCents(Math.round(toCents(amount) / divisor));
}
