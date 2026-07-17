/* Storage namespace.
   The HTML reference wrote everything under `dittomart_` (the LS map in its
   app.js). This app owns `sriaadhya_`; migrateLegacyStorage() carries a
   returning visitor's data across once, before any store hydrates. */

export const STORAGE_PREFIX = 'sriaadhya_';
export const LEGACY_STORAGE_PREFIX = 'dittomart_';

/** Old key → new key. The legacy values were raw JSON; zustand's persist wraps
    state in `{ state, version }`, so only the keys whose shape survived that
    change are migrated — a cart of the old shape would hydrate as garbage. */
const LEGACY_KEYS: Record<string, string> = {
  [`${LEGACY_STORAGE_PREFIX}location`]: `${STORAGE_PREFIX}location`,
};

const MIGRATED_FLAG = `${STORAGE_PREFIX}migrated_v1`;

/**
 * Runs once, at module import time from App.tsx — before any persisted store
 * hydrates. Copies a legacy key into the new namespace only when the new key is
 * absent, then drops the old one.
 */
export function migrateLegacyStorage(): void {
  try {
    if (localStorage.getItem(MIGRATED_FLAG)) return;
    for (const [oldKey, newKey] of Object.entries(LEGACY_KEYS)) {
      const value = localStorage.getItem(oldKey);
      if (value !== null && localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, value);
      }
      localStorage.removeItem(oldKey);
    }
    localStorage.setItem(MIGRATED_FLAG, '1');
  } catch {
    // Private mode / disabled storage — nothing to migrate.
  }
}

/** Breadcrumbs across the gateway bounce. sessionStorage, not local: they are
    meaningless once the tab is gone. */
export const PENDING = {
  orderId: `${STORAGE_PREFIX}pending_order_id`,
  uniqueOrderId: `${STORAGE_PREFIX}pending_unique_order_id`,
  method: `${STORAGE_PREFIX}pending_method`,
} as const;
