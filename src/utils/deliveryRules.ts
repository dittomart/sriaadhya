/* =====================================================================
   Where this store will and won't deliver.

   The BACKEND owns this answer, and it is asked for it rather than guessed:

     - a saved address carries `is_operational` from /get-addresses (that call
       sends restaurant_id, which is what makes the backend stamp it). It runs
       the same check its admin panel does — the store's delivery areas when any
       are configured, otherwise `distance <= delivery_radius`.
     - the delivery FEE and the distance both come from /get-deliverable-amount.

   The haversine below is used ONLY for the location-pin hint on /location and
   /address, where there is no saved address yet to ask about. It is a preview,
   never the gate: the gate is the backend's own verdict at checkout.

   Note `/place-order` does NOT enforce the radius — so this app is the only
   thing standing between a far-away customer and an order the store can't
   fulfil. That's why the block lives at PaymentPage, on the backend's answer.
   ===================================================================== */

/** Escape hatch for testing the payment flow from anywhere. Leave this false in
    production — true lets an order be placed at any distance. */
export const IGNORE_DELIVERY_RADIUS = false;

/** The pin preview on /location and /address. `radius <= 0` means the store has
    not configured one — never invent a limit it didn't set. */
export function isWithinRadius(distanceKm: number, radiusKm: number): boolean {
  if (IGNORE_DELIVERY_RADIUS) return true;
  if (radiusKm <= 0) return true;
  return distanceKm <= radiusKm;
}

/** Whether an order may be placed to this saved address. Reads the backend's
    verdict; the flag only exists to let testing bypass it. */
export function canDeliverTo(address: { isDeliverable: boolean } | null | undefined): boolean {
  if (IGNORE_DELIVERY_RADIUS) return true;
  return !!address?.isDeliverable;
}

/** The quoted distance measured against the store's configured radius, for the
    cart — which has the quote long before /payment has an address to check.
    Null distance means no quote yet (guest, or still loading): unknown is not
    out of range, so the cart stays quiet rather than blocking on a maybe. */
export function isOutOfRange(distanceKm: number | null, radiusKm: number): boolean {
  if (IGNORE_DELIVERY_RADIUS) return false;
  if (distanceKm == null) return false;
  return !isWithinRadius(distanceKm, radiusKm);
}
