/* =====================================================================
   Storage namespace.
   The HTML reference wrote everything under `dittomart_` (LS map in app.js).
   The React app owns the `sriaadhya_` namespace; migrateLegacyStorage()
   carries a returning visitor's data across once.
   ===================================================================== */

export const STORAGE_PREFIX = 'sriaadhya_';
export const LEGACY_STORAGE_PREFIX = 'dittomart_';

/** Every key the app persists, unprefixed. Mirrors app.js `LS`. */
const KEY_NAMES = [
  'location',
  'cart',
  'user',
  'addresses',
  'active_address',
  'orders',
  'active_order',
  'food_type_filter',
  'checkout',
  'pay_method',
  'pending_coupon',
  'fav_orders',
] as const;

type KeyName = (typeof KEY_NAMES)[number];

export const LS: Record<KeyName, string> = KEY_NAMES.reduce(
  (acc, k) => ({ ...acc, [k]: `${STORAGE_PREFIX}${k}` }),
  {} as Record<KeyName, string>,
);

const MIGRATED_FLAG = `${STORAGE_PREFIX}migrated_v1`;

/**
 * Copies `dittomart_*` keys into the `sriaadhya_*` namespace, but only where
 * the new key is absent. Runs once — guarded by the migrated flag.
 * Called at module import time from App.tsx, before any store hydrates.
 */
export function migrateLegacyStorage(): void {
  try {
    if (localStorage.getItem(MIGRATED_FLAG)) return;
    for (const name of KEY_NAMES) {
      const legacyKey = `${LEGACY_STORAGE_PREFIX}${name}`;
      const newKey = `${STORAGE_PREFIX}${name}`;
      const legacyValue = localStorage.getItem(legacyKey);
      if (legacyValue !== null && localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, legacyValue);
      }
    }
    localStorage.setItem(MIGRATED_FLAG, '1');
  } catch {
    // Private-mode / disabled storage — nothing to migrate.
  }
}

/** JSON read — port of app.js `get()`. */
export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return (JSON.parse(raw) as T) ?? fallback;
  } catch {
    return fallback;
  }
}

/** JSON write — port of app.js `set()`. */
export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded / disabled storage — the value is transient anyway.
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
