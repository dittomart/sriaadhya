import { AREAS, BRAND } from '@/api/_seed';
import type { Area } from '@/api/_seed';

/** Haversine distance in km — verbatim port of app.js `distanceKm()`. */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const STORE = { lat: BRAND.storeLat, lng: BRAND.storeLng };

/** Distance of a point from the Avinashi store. */
export function distanceFromStore(lat: number, lng: number): number {
  return distanceKm(STORE.lat, STORE.lng, lat, lng);
}

/** Port of login.html `nearestArea()`. */
export function nearestArea(lat: number, lng: number): (Area & { d: number }) | null {
  return (
    AREAS.map((a) => ({ ...a, d: distanceKm(lat, lng, a.lat, a.lng) })).sort((x, y) => x.d - y.d)[0] ?? null
  );
}

/** Human-readable geolocation error — copy from location.html / login.html detectGPS(). */
export function geoErrorMessage(code: number): string {
  if (code === 1) return 'Location permission denied — allow location for this site in your browser settings';
  if (code === 2) return 'Location unavailable — turn on GPS / location services and try again';
  return 'Location timed out — try again, or search your area below';
}
