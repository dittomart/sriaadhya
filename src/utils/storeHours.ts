import type { StoreLocation } from '@/types';

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

/** "9:00 AM", "09:00", "0900", 9 → minutes past midnight, or null. */
function toMinutes(raw: unknown): number | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;

  const m = s.match(/^(\d{1,2})[:.]?(\d{2})?\s*(am|pm)?$/i);
  if (!m) return null;

  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ampm = m[3]?.toLowerCase();

  if (!Number.isFinite(h) || !Number.isFinite(min)) return null;
  if (ampm === 'pm' && h < 12) h += 12;
  if (ampm === 'am' && h === 12) h = 0;

  return h * 60 + min;
}

/** The store's own clock is IST — the browser's may not be. */
function nowIst(): { day: string; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const day = get('weekday').slice(0, 3).toLowerCase();
  const hour = parseInt(get('hour'), 10);
  const minute = parseInt(get('minute'), 10);

  return {
    day,
    minutes: (Number.isFinite(hour) ? hour : 0) * 60 + (Number.isFinite(minute) ? minute : 0),
  };
}

/** Open/closed, in the backend's own order of authority:
      1. schedule_override — the admin's manual force-open / force-close
      2. is_schedulable === false — the admin runs the store by hand, so is_active is the answer
      3. today's window, when the schedule parsed into one
      4. is_active — the last-resort signal
    A window that ends before it starts (22:00 → 02:00) wraps past midnight.

    This store ships is_schedulable = 0 and schedule_data = null, so in practice
    it answers from is_active — which is exactly the intent: the admin opens and
    closes it by hand. */
export function isStoreOpenNow(store: StoreLocation | null): boolean {
  if (!store) return false;

  if (store.scheduleOverride === 1) return true;
  if (store.scheduleOverride === 0) return false;
  if (!store.isSchedulable) return store.isActive;

  const { day, minutes } = nowIst();
  const window = store.hours[day];
  if (!window) return store.isActive;

  const open = toMinutes(window[0]);
  const close = toMinutes(window[1]);
  if (open == null || close == null) return store.isActive;

  return close > open
    ? minutes >= open && minutes < close
    : minutes >= open || minutes < close; // wraps past midnight
}

/** Every day the store publishes, in week order. Empty when it runs by hand. */
export function weekHours(store: StoreLocation | null): Array<{ day: string; hours: string | null }> {
  if (!store) return [];
  return DAYS.map((d) => {
    const w = store.hours[d];
    return {
      day: d.charAt(0).toUpperCase() + d.slice(1),
      hours: w ? `${w[0]} – ${w[1]}` : null,
    };
  });
}
