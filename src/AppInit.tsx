import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { useGetBrands, useGetLocations } from '@/api/queries/useInit';
import { useAppStore } from '@/store/appStore';
import { DotLoader } from '@/ui/DotLoader';

/** Boot: resolve which brand this build is, then its store.

    The gate reads the ZUSTAND MIRRORS, not the query flags. The store is written
    into zustand from inside useGetLocations' queryFn, and an effect would land
    one render later — in that render the queries say "done" while
    `storeLocation` is still null, which is long enough for every consumer to see
    a storeless app and flash "unavailable". */
export function AppInit({ children }: { children: ReactNode }) {
  const { data: brand, isLoading: brandLoading, isError } = useGetBrands();
  const { data: locations, isLoading: locLoading } = useGetLocations(brand?.uniqueId);

  const setBrand = useAppStore((s) => s.setBrand);
  const appBrand = useAppStore((s) => s.brand);
  const appStore = useAppStore((s) => s.storeLocation);

  useEffect(() => {
    if (brand) setBrand(brand);
  }, [brand, setBrand]);

  if (isError || (!brandLoading && !brand)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--cream)]">
        <div className="max-w-md w-full text-center" style={{ animation: 'fadeUp .5s ease' }}>
          <img src="/images/logo.png" alt="SRI AADHYA FROZENS" className="h-14 w-auto mx-auto mb-5 object-contain" />
          <h1 className="display text-2xl font-extrabold">We couldn't load the store</h1>
          <p className="text-[var(--ink-soft)] text-sm mt-2">
            Check your connection and try again — we'll be right here.
          </p>
          <button onClick={() => window.location.reload()} className="btn btn-primary w-full mt-6 py-3.5">
            <RefreshCw className="w-4 h-4" /> Try again
          </button>
        </div>
      </div>
    );
  }

  const locationsReady = !!locations && locations.length > 0;
  const waitingForStoreSync = (!appBrand && !!brand) || (locationsReady && !appStore);

  if (brandLoading || locLoading || waitingForStoreSync) return <DotLoader />;

  return <>{children}</>;
}
