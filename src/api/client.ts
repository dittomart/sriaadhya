import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const RAW_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'https://app.dittomart.in/public/api';

/** No trailing slash, ever — every path in this app starts with one. */
export const API_BASE_URL = RAW_BASE.replace(/\/+$/, '');

/** The host that serves uploaded images: the API base with its /api suffix cut. */
export const ASSET_HOST = API_BASE_URL.replace(/\/public\/api$/, '').replace(/\/api$/, '');

export const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

/** The platform string the backend expects on X-Client-Platform. */
export function clientPlatform(): 'web' | 'android' | 'ios' {
  if (typeof navigator === 'undefined') return 'web';
  const ua = navigator.userAgent || '';
  if (ua === 'FoodomaaAndroidWebViewUA') return 'android';
  if (typeof window !== 'undefined' && 'ReactNativeWebView' in window) {
    return /iPhone|iPad|iPod/i.test(ua) ? 'ios' : 'android';
  }
  return 'web';
}

/* Laravel's jwt.auth middleware accepts the token from the Authorization header
   OR from a `token` key in the body — and the legacy endpoints (/place-order,
   /brand/{slug}/get-orders, /update-user-info) only ever read the body. Carry it
   in BOTH, globally, so no endpoint has to remember to do it itself. */
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().authToken;

  if (config.headers) {
    config.headers.set('X-Client-Platform', clientPlatform());
    if (token) config.headers.set('Authorization', `Bearer ${token}`);
  }

  if (token) {
    const method = (config.method || '').toUpperCase();
    if (method === 'POST' || method === 'PUT') {
      const body: unknown = config.data;
      if (body == null) {
        config.data = { token };
      } else if (
        typeof body === 'object' &&
        !(body instanceof FormData) &&
        !(body instanceof URLSearchParams) &&
        !(body instanceof Blob) &&
        !(body instanceof ArrayBuffer)
      ) {
        const obj = body as Record<string, unknown>;
        if (obj.token == null) obj.token = token;
      }
    }
  }

  return config;
});

/* A dead token must not leave a half-signed-in app behind. Clear the session and
   let the next render react to the empty store — navigating from inside an
   interceptor fights whatever route transition is already in flight.

   Only when there WAS a token, though: several endpoints answer 401 to a guest
   simply because they require an account, and signing out a browsing customer
   over that would be wrong. */
client.interceptors.response.use(
  (r) => r,
  (err: unknown) => {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 401 && useAuthStore.getState().authToken) {
      /* An expired token is the same customer needing a fresh session — not a
         different person sitting down. Keep their basket (and their delivery
         pin, which is where they ARE, not who they are). */
      useAuthStore.getState().logout({ keepCart: true });
    }
    return Promise.reject(err);
  },
);

/** The public files the backend serves all live under `/assets/…` on disk — its
    Blade does `asset('assets/' . $row->logo)`. But the API ships some columns
    WITH that prefix baked in (`/assets/img/items/x.jpg`) and others WITHOUT it
    (brand `logo` = `brands/logos/x.jpeg`). Requesting the bare path misses the
    file and the SPA host answers with index.html — a 200 that is not an image,
    so it renders blank. Normalise here: anything not already rooted at
    `assets/` gets it. */
function withAssetsRoot(pathname: string): string {
  const clean = pathname.replace(/^\/+/, '');
  if (/^assets\//i.test(clean) || /^(storage|img)\//i.test(clean)) return clean;
  return `assets/${clean}`;
}

/** Turn whatever path the backend ships (relative, or absolute against a dev
    host that is not reachable from this browser) into a URL that loads. */
export function assetUrl(path: string | null | undefined): string {
  if (!path) return '';
  const p = String(path).trim();
  if (!p) return '';

  if (/^https?:\/\//i.test(p)) {
    try {
      const u = new URL(p);
      if (/^(localhost|127\.0\.0\.1|192\.168\.|10\.)/i.test(u.hostname)) {
        return `${ASSET_HOST}/${withAssetsRoot(u.pathname)}${u.search}`;
      }
      return p;
    } catch {
      return p;
    }
  }

  return `${ASSET_HOST}/${withAssetsRoot(p)}`;
}

/** Backend numbers arrive as `"220.00"` as often as `220`. */
export function num(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : fallback;
}

/** `1`, `"1"`, `true` all mean yes; `0`, `"0"`, `false`, null all mean no. */
export function truthy(v: unknown): boolean {
  if (v === true || v === 1) return true;
  if (typeof v === 'string') return v === '1' || v.toLowerCase() === 'true';
  return false;
}

/** The message a failed call should show a customer. */
export function apiErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const resp = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response;
  const data = resp?.data;
  if (data?.errors) {
    const first = Object.values(data.errors)[0];
    if (Array.isArray(first) && first[0]) return String(first[0]);
  }
  if (data?.message) return String(data.message);
  return fallback;
}
