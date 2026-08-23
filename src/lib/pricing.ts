/**
 * Format a number as Malaysian Ringgit.
 * Usage: formatMYR(3.25) → "RM3.25"
 */
export function formatMYR(amount: number): string {
  return `RM${amount.toFixed(2)}`;
}

/**
 * Pricing constants + helpers — shared across cart, checkout, API.
 */
export const FREE_DELIVERY_THRESHOLD = 25;
export const DELIVERY_FLAT = 3.99;
export const SST_RATE = 0.06; // 6% SST

export interface Pricing {
  subtotal: number;
  delivery: number;
  sst: number;
  total: number;
}

export function computePricing(subtotal: number): Pricing {
  const delivery = subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0 : DELIVERY_FLAT;
  const sst = subtotal * SST_RATE;
  const total = subtotal + delivery + sst;
  return { subtotal, delivery, sst, total };
}
