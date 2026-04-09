// ---------------------------------------------------------------------------
// Validation utilities
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Shared result type
// ---------------------------------------------------------------------------

interface ValidationResult {
  valid: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Phone number (E.164 format)
// ---------------------------------------------------------------------------

/**
 * Validates a phone number in E.164 format.
 * Must start with `+`, followed by a country code and subscriber number,
 * with a total length of 10–15 digits (excluding the leading `+`).
 *
 * Examples of valid numbers: +919876543210, +14155552671
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone number is required' };
  }

  const trimmed = phone.trim();

  // Must start with +
  if (!trimmed.startsWith('+')) {
    return {
      valid: false,
      error: 'Phone number must be in E.164 format (e.g. +919876543210)',
    };
  }

  // After the +, only digits allowed
  const digits = trimmed.slice(1);

  if (!/^\d+$/.test(digits)) {
    return { valid: false, error: 'Phone number must contain only digits after the +' };
  }

  if (digits.length < 10 || digits.length > 15) {
    return {
      valid: false,
      error: 'Phone number must have between 10 and 15 digits (excluding the +)',
    };
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// Weight (gross and tare)
// ---------------------------------------------------------------------------

const MAX_WEIGHT_KG = 1000;

/**
 * Validates gross and tare weight values for a collection ticket.
 *
 * Rules:
 *  - grossKg must be > 0
 *  - tareKg must be >= 0
 *  - grossKg must be > tareKg (net weight must be positive)
 *  - grossKg must not exceed MAX_WEIGHT_KG (1000 kg)
 */
export function validateWeight(grossKg: number, tareKg: number): ValidationResult {
  if (typeof grossKg !== 'number' || isNaN(grossKg)) {
    return { valid: false, error: 'Gross weight must be a number' };
  }

  if (typeof tareKg !== 'number' || isNaN(tareKg)) {
    return { valid: false, error: 'Tare weight must be a number' };
  }

  if (grossKg <= 0) {
    return { valid: false, error: 'Gross weight must be greater than 0' };
  }

  if (tareKg < 0) {
    return { valid: false, error: 'Tare weight must be 0 or greater' };
  }

  if (grossKg <= tareKg) {
    return {
      valid: false,
      error: 'Gross weight must be greater than tare weight',
    };
  }

  if (grossKg > MAX_WEIGHT_KG) {
    return {
      valid: false,
      error: `Gross weight must not exceed ${MAX_WEIGHT_KG} kg`,
    };
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// Quality grade
// ---------------------------------------------------------------------------

const VALID_GRADES = new Set(['A', 'B', 'C', 'reject']);

/**
 * Returns true if the provided grade is one of the accepted quality grades:
 * 'A', 'B', 'C', or 'reject'.
 */
export function validateQualityGrade(grade: string): boolean {
  return VALID_GRADES.has(grade);
}

// ---------------------------------------------------------------------------
// Price per kg
// ---------------------------------------------------------------------------

const MAX_PRICE_PER_KG = 10_000;

/**
 * Validates the price-per-kg field on a collection ticket.
 *
 * Rules:
 *  - price must be > 0
 *  - price must be < MAX_PRICE_PER_KG (10 000)
 */
export function validatePricePerKg(price: number): ValidationResult {
  if (typeof price !== 'number' || isNaN(price)) {
    return { valid: false, error: 'Price must be a number' };
  }

  if (price <= 0) {
    return { valid: false, error: 'Price per kg must be greater than 0' };
  }

  if (price >= MAX_PRICE_PER_KG) {
    return {
      valid: false,
      error: `Price per kg must be less than ${MAX_PRICE_PER_KG}`,
    };
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// OTP
// ---------------------------------------------------------------------------

/**
 * Validates a one-time password (OTP).
 * Must be exactly 6 numeric digits.
 */
export function validateOtp(otp: string): ValidationResult {
  if (!otp || typeof otp !== 'string') {
    return { valid: false, error: 'OTP is required' };
  }

  const trimmed = otp.trim();

  if (!/^\d{6}$/.test(trimmed)) {
    return { valid: false, error: 'OTP must be exactly 6 digits' };
  }

  return { valid: true };
}
