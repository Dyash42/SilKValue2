// ---------------------------------------------------------------------------
// Idempotency key utilities
// ---------------------------------------------------------------------------

const TICKET_PREFIX = 'silk:ticket:';
const PAYMENT_PREFIX = 'silk:payment:';

/**
 * Generates an idempotency key for a collection ticket.
 *
 * Format: `silk:ticket:<reelerId>:<collectorId>:<timestamp>`
 *
 * @param reelerId   UUID of the reeler (farmer)
 * @param collectorId UUID of the collector
 * @param timestamp  Unix timestamp in milliseconds (Date.now())
 */
export function generateTicketKey(
  reelerId: string,
  collectorId: string,
  timestamp: number,
): string {
  return `${TICKET_PREFIX}${reelerId}:${collectorId}:${timestamp}`;
}

/**
 * Generates an idempotency key for a payment.
 *
 * Format: `silk:payment:<ticketId>:<amount>:<timestamp>`
 *
 * @param ticketId   Local or server ticket ID
 * @param amount     Payment amount (will be converted to string)
 * @param timestamp  Unix timestamp in milliseconds (Date.now())
 */
export function generatePaymentKey(
  ticketId: string,
  amount: number,
  timestamp: number,
): string {
  return `${PAYMENT_PREFIX}${ticketId}:${amount}:${timestamp}`;
}

/**
 * Validates whether a string is a well-formed idempotency key produced by
 * this module.
 *
 * Rules:
 *  - Must start with `silk:ticket:` or `silk:payment:`
 *  - Must have exactly the right number of colon-delimited segments
 *  - The final segment (timestamp) must be a positive integer
 *  - Non-timestamp segments must be non-empty
 */
export function isValidIdempotencyKey(key: string): boolean {
  if (typeof key !== 'string' || key.length === 0) return false;

  const isTicket = key.startsWith(TICKET_PREFIX);
  const isPayment = key.startsWith(PAYMENT_PREFIX);

  if (!isTicket && !isPayment) return false;

  // Strip the known prefix and split the remainder.
  const prefix = isTicket ? TICKET_PREFIX : PAYMENT_PREFIX;
  const remainder = key.slice(prefix.length);

  // Expected segments after prefix:
  //   ticket:  <reelerId>:<collectorId>:<timestamp>  → 3 parts
  //   payment: <ticketId>:<amount>:<timestamp>       → 3 parts
  const parts = remainder.split(':');
  if (parts.length !== 3) return false;

  const [part0, part1, part2] = parts;

  // All non-timestamp parts must be non-empty.
  if (!part0 || !part1 || !part2) return false;

  // The last segment must be a positive integer timestamp.
  const timestamp = Number(part2);
  if (!Number.isInteger(timestamp) || timestamp <= 0) return false;

  return true;
}
