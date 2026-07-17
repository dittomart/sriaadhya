import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client, num } from '@/api/client';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useLocationStore } from '@/store/locationStore';
import { distanceKm } from '@/utils/geo';
import { normalizePhone } from '@/utils/normalizePhone';
import type { AuthUser } from '@/types';

export type GenerateOtpStatus =
  | 'otp'
  | 'new_user'
  | 'user_deleted'
  | 'email_phone_already_used'
  | 'generic_error';

interface ApiGenerateOtp {
  otp?: boolean;
  new_user?: boolean;
  user_deleted?: boolean;
  email_phone_already_used?: boolean;
  message?: string;
}

export interface GenerateOtpResult {
  status: GenerateOtpStatus;
  message?: string;
}

/** POST /generate-otp-for-login

    The backend answers with flags rather than a status, and they have to be read
    in the right order: a deleted account and an email collision both also look
    like "no OTP sent". */
export function useGenerateOtp() {
  return useMutation({
    mutationFn: async (input: { phone: string; name?: string; email?: string }): Promise<GenerateOtpResult> => {
      const body: Record<string, unknown> = { phone: normalizePhone(input.phone) };
      if (input.name) body.name = input.name;
      if (input.email) body.email = input.email;

      const { data } = await client.post<ApiGenerateOtp>('/generate-otp-for-login', body);

      if (data?.email_phone_already_used) {
        return { status: 'email_phone_already_used', message: data.message };
      }
      if (data?.user_deleted) return { status: 'user_deleted', message: data.message };
      if (data?.otp === true) return { status: 'otp', message: data.message };
      /* No OTP and the account does not exist yet → the UI has to collect a name
         and an email before the backend will create one. */
      if (data?.new_user || data?.otp === false) {
        return { status: data?.message ? 'generic_error' : 'new_user', message: data?.message };
      }
      return { status: 'generic_error', message: data?.message };
    },
  });
}

interface ApiAuthUser {
  id: number;
  auth_token?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  default_address_id?: number | null;
  default_address?: {
    address?: string | null;
    house?: string | null;
    latitude?: string | number | null;
    longitude?: string | number | null;
    tag?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
  } | null;
  wallet_balance?: number | string | null;
  avatar?: string | null;
}

interface ApiVerifyOtp {
  success?: boolean;
  data?: ApiAuthUser | string;
  message?: string;
}

export interface VerifyOtpResult {
  ok: boolean;
  message?: string;
}

function mapAuthUser(p: ApiAuthUser): AuthUser {
  return {
    id: num(p.id),
    name: String(p.name ?? ''),
    phone: String(p.phone ?? ''),
    email: p.email ?? undefined,
    wallet: num(p.wallet_balance),
    defaultAddressId: p.default_address_id ?? null,
    avatar: p.avatar ?? null,
  };
}

/** POST /login-with-otp

    On failure the backend puts the reason in `data` as a plain string, so a
    truthy `data` is not a success — the shape has to be checked. */
export function useVerifyOtp() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      phone: string;
      otp: string;
      name?: string;
      email?: string;
    }): Promise<VerifyOtpResult> => {
      const body: Record<string, unknown> = {
        phone: normalizePhone(input.phone),
        otp: input.otp,
      };
      if (input.name) body.name = input.name;
      if (input.email) body.email = input.email;

      const { data } = await client.post<ApiVerifyOtp>('/login-with-otp', body);

      const payload = data?.data;
      if (data?.success === false || typeof payload === 'string' || !payload) {
        const message = typeof payload === 'string' ? payload : (data?.message ?? 'That code did not work.');
        return { ok: false, message };
      }

      const user = mapAuthUser(payload);
      useAuthStore.getState().setSession(user, payload.auth_token ?? null);

      /* A returning customer already has a delivery pin on file. Seeding the
         location store from it skips the whole /location detour — but only when
         the coordinates are real: (0,0) is the sentinel a half-filled address
         row leaves behind, and it would place the customer off the coast of
         Africa. */
      try {
        const da = payload.default_address;
        const lat = num(da?.latitude, NaN);
        const lng = num(da?.longitude, NaN);
        const store = useAppStore.getState().storeLocation;

        if (Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0) && store) {
          const dist = distanceKm(lat, lng, store.latitude, store.longitude);
          useLocationStore.getState().setLocation({
            address: String(da?.address ?? ''),
            area: String(da?.address ?? '').split(',')[0]?.trim() ?? '',
            lat,
            lng,
            serviceable: store.deliveryRadius <= 0 || dist <= store.deliveryRadius,
            distanceKm: Math.round(dist * 10) / 10,
          });
        }
      } catch {
        /* a malformed default address must never block a valid login */
      }

      qc.invalidateQueries({ queryKey: ['addresses'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });

      return { ok: true };
    },
  });
}

interface ApiDeleteAccount {
  success?: boolean;
  message?: string;
}

/** POST /delete-user-account

    Cleanup runs in onSettled, not onSuccess: whatever the server said — even a
    network error — the customer asked to be signed out, and leaving a live
    session behind after "Account deleted" is worse than a stale server row. */
export function useDeleteAccount() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{ ok: boolean; message?: string }> => {
      try {
        const { data } = await client.post<ApiDeleteAccount>('/delete-user-account', {});
        return { ok: data?.success !== false, message: data?.message };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not delete account';
        return { ok: false, message };
      }
    },
    onSettled: () => {
      try {
        useAuthStore.getState().logout();
        useLocationStore.getState().clear();
        useCartStore.getState().clear();
        qc.clear();
      } catch {
        /* no-op */
      }
    },
  });
}

/** A logout the customer asked for: the basket goes too. */
export function logoutFully(): void {
  useAuthStore.getState().logout();
  useCartStore.getState().clear();
}
