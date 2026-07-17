/** Haversine distance in km.

    Used for the LOCATION-PIN serviceability hint only. The delivery fee and the
    `dis` value /place-order is given both come from /get-deliverable-amount —
    re-deriving distance for those would break the backend's own formula. */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Human-readable geolocation failure — the browser only gives us a code. */
export function geoErrorMessage(code: number): string {
  if (code === 1) return 'Location permission denied — allow location for this site in your browser settings';
  if (code === 2) return 'Location unavailable — turn on GPS / location services and try again';
  return 'Location timed out — try again, or search your area below';
}
