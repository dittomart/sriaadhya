/** Order id — port of order-success.html `'DM-' + Math.floor(100000+Math.random()*900000)`.
    TODO[part-2]: the backend issues the real unique order id; drop this. */
export function makeOrderId(): string {
  return 'DM-' + Math.floor(100000 + Math.random() * 900000);
}

/** Address id — port of address.html saveAddr(). */
export function makeAddressId(existingCount: number): string {
  return 'addr_' + (existingCount + 1).toString().padStart(3, '0') + '_' + Math.floor(performance.now());
}
