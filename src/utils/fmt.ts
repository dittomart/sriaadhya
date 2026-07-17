/** ₹ formatter — verbatim port of app.js `rupee()`. */
export const rupee = (n: number): string => '₹' + Math.round(n).toLocaleString('en-IN');

/** Port of app.js `discountPct()`. */
export function discountPct(price: number, mrp: number): number {
  return mrp && mrp > price ? Math.round((1 - price / mrp) * 100) : 0;
}
