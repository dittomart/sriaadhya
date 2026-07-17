import { useQuery } from '@tanstack/react-query';
import { client, num } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import type { WalletTransaction } from '@/types';

interface ApiTxn {
  id: number;
  /** PAISE — the balance beside it is in rupees. Yes, really. */
  amount: number | string;
  type?: string;
  description?: string | null;
  created_at?: string;
}

export interface WalletData {
  balance: number;
  transactions: WalletTransaction[];
}

/** POST /get-wallet-transactions

    `balance` is rupees; `transactions[].amount` is paise. The split is a backend
    quirk, normalised here so nothing downstream has to remember it. */
export function useGetWallet() {
  const token = useAuthStore((s) => s.authToken);
  const setWallet = useAuthStore((s) => s.setWallet);

  return useQuery<WalletData>({
    queryKey: ['wallet', token],
    enabled: !!token,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await client.post<{ balance?: number | string; transactions?: ApiTxn[] }>(
        '/get-wallet-transactions',
        {},
      );

      const balance = num(data?.balance);
      const rows = Array.isArray(data?.transactions) ? data.transactions : [];

      /* The auth store's copy of the balance was written at login and drifts —
         this is the fresh number, so keep the two in step. */
      setWallet(balance);

      return {
        balance,
        transactions: rows.map((t) => {
          const kind = String(t.type ?? '').toLowerCase();
          return {
            id: num(t.id),
            amount: num(t.amount) / 100,
            type: kind === 'withdraw' || kind === 'debit' ? ('debit' as const) : ('credit' as const),
            description: String(t.description ?? ''),
            createdAt: String(t.created_at ?? ''),
          };
        }),
      };
    },
  });
}
