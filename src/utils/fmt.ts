/** ₹ with Indian digit grouping. */
export const rupee = (n: number): string => '₹' + Math.round(n).toLocaleString('en-IN');

/** Percent off, or 0 when there's no saving to show. */
export function discountPct(price: number, mrp: number): number {
  return mrp && mrp > price ? Math.round((1 - price / mrp) * 100) : 0;
}
