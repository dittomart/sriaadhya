import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Info, Leaf, MapPin, Navigation, ShieldCheck, Store, Timer, Zap } from 'lucide-react';
import { useCoordinateToAddress } from '@/api/mutations/useAddresses';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import { isWithinRadius } from '@/utils/deliveryRules';
import { distanceKm, geoErrorMessage } from '@/utils/geo';
import type { UserLocation } from '@/types';

/** Set the delivery pin. Real GPS only — no fallback coordinates, because a
    guessed pin quietly delivers someone else's order to the wrong street.

    Every location is accepted here; being outside the radius only changes the
    message. The delivery-radius restriction is enforced at checkout. */
export function LocationPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/home';

  const brand = useAppStore((s) => s.brand);
  const store = useAppStore((s) => s.storeLocation);
  const setLocation = useLocationStore((s) => s.setLocation);
  const user = useAuthStore((s) => s.user);
  const reverseGeocode = useCoordinateToAddress();

  const [detecting, setDetecting] = useState(false);
  const [hint, setHint] = useState<{ text: string; error: boolean }>({
    text: 'We use this only to check delivery & navigate to you',
    error: false,
  });
  const [pending, setPending] = useState<(UserLocation & { accuracy?: number }) | null>(null);

  const radius = store?.deliveryRadius ?? 0;

  const detectGPS = () => {
    setDetecting(true);
    let settled = false;

    const fail = (msg: string) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(wd);
      setDetecting(false);
      setHint({ text: msg, error: true });
    };

    const done = async (lat: number, lng: number, accuracy: number) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(wd);

      const dist = store ? distanceKm(lat, lng, store.latitude, store.longitude) : 0;
      const serviceable = !store || isWithinRadius(dist, radius);

      /* Ask the backend what this pin is called. It's the same geocoder the
         admin panel reads, so the name here matches the name on the order. */
      let address = '';
      try {
        address = await reverseGeocode.mutateAsync({ lat, lng });
      } catch {
        /* A nameless pin is still a valid pin — the coordinates are what
           deliver the order. */
      }

      setDetecting(false);
      setHint({ text: 'We use this only to check delivery & navigate to you', error: false });
      setPending({
        address,
        area: address ? (address.split(',')[0]?.trim() ?? '') : 'My current location',
        lat: +lat.toFixed(5),
        lng: +lng.toFixed(5),
        serviceable,
        distanceKm: Math.round(dist * 10) / 10,
        accuracy: accuracy ? Math.round(accuracy) : undefined,
      });
    };

    const wd = window.setTimeout(() => fail('Could not get your location — check GPS and try again'), 20000);

    if (!navigator.geolocation || !window.isSecureContext) {
      fail('Location needs a secure page — open over http://localhost or https, not as a file');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => void done(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
      (e) => fail(geoErrorMessage(e.code)),
      { enableHighAccuracy: true, timeout: 18000, maximumAge: 0 },
    );
  };

  const confirmLocation = () => {
    if (!pending) return;
    const { accuracy: _accuracy, ...loc } = pending;
    setLocation(loc);
    navigate(next, { replace: true });
  };

  const acc = pending?.accuracy;

  return (
    <div className="min-h-screen flex flex-col">
      {/* top decorative band */}
      <div className="brand-grad-soft text-white px-6 pt-12 pb-20 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 text-[120px] opacity-10 leaf-sway">🌿</div>
        <div className="absolute right-20 bottom-2 text-5xl opacity-20 float">🍃</div>
        <div className="max-w-md mx-auto relative">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg overflow-hidden">
              <img
                src={brand?.logo || '/images/logo.png'}
                alt={brand?.name ?? 'SRI AADHYA'}
                className="w-10 h-10 object-contain"
              />
            </div>
            <div>
              <div className="display text-2xl font-extrabold leading-none">
                SRI AADHYA <span style={{ color: 'var(--brand-light)' }}>FROZENS</span>
              </div>
              <div className="text-[11px] text-white/80 font-bold uppercase tracking-widest">
                Freshness Frozen, Goodness Preserved
              </div>
            </div>
          </div>
          <h1 className="display text-3xl font-extrabold leading-tight">
            Where should we
            <br />
            deliver freshness?
          </h1>
          <p className="text-white/80 text-sm mt-2 flex items-center gap-2">
            <Zap className="w-4 h-4" /> {store?.deliveryTime ?? 30}-min delivery in {store?.city ?? 'Avinashi'}
            {radius > 0 && ` & ${radius} km around`}
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-5 -mt-12 relative flex-1 pb-10">
        <div className="card p-5 shadow-lg" style={{ animation: 'fadeUp .5s ease' }}>
          <button onClick={detectGPS} disabled={detecting} className="btn btn-primary w-full py-3.5 text-base">
            <Navigation className={`w-5 h-5 ${detecting ? 'animate-spin' : ''}`} />
            <span>{detecting ? 'Detecting…' : 'Use my current location'}</span>
          </button>
          <p className="text-[11px] text-center mt-2 text-[var(--ink-soft)]">
            {hint.error ? <span className="text-[var(--coral)]">{hint.text}</span> : hint.text}
          </p>

          {pending && (
            <div className="mt-4 p-3 rounded-xl bg-[var(--leaf-100)] border border-[var(--green-500)]/30">
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-[var(--green-700)] mt-0.5 flex-none" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">{pending.area}</div>
                  {pending.address && pending.address !== pending.area && (
                    <div className="text-[11px] text-[var(--ink-soft)]">{pending.address}</div>
                  )}
                  <div className="text-[11px] text-[var(--ink-soft)] font-mono">
                    {pending.lat.toFixed(5)}, {pending.lng.toFixed(5)}
                    {acc ? ` • ±${acc} m` : ''}
                  </div>
                  <div className="text-[11px] font-semibold mt-1">
                    {pending.serviceable ? (
                      <span className="text-[var(--green-700)] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> We deliver here • {pending.distanceKm.toFixed(1)} km
                        away
                      </span>
                    ) : (
                      <span className="text-amber-700 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" /> {pending.distanceKm.toFixed(1)} km away — outside our {radius}{' '}
                        km zone. You can browse; ordering isn't available here yet.
                      </span>
                    )}
                    {acc != null && acc > 1000 && (
                      <span className="block mt-1 text-[11px] text-[var(--ink-soft)]">
                        Approximate fix (±{(acc / 1000).toFixed(1)} km) — not GPS. If this looks wrong, try again
                        outdoors.
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={confirmLocation} className="btn btn-primary w-full mt-3 py-3">
                Confirm &amp; Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* trust strip */}
        <div className="grid grid-cols-3 gap-2 mt-5 text-center">
          <div className="card p-3">
            <Timer className="w-5 h-5 text-[var(--green-700)] mx-auto" />
            <div className="text-[11px] font-bold mt-1">{store?.deliveryTime ?? 30} min</div>
            <div className="text-[10px] text-[var(--ink-soft)]">delivery</div>
          </div>
          <div className="card p-3">
            <ShieldCheck className="w-5 h-5 text-[var(--green-700)] mx-auto" />
            <div className="text-[11px] font-bold mt-1">Quality</div>
            <div className="text-[10px] text-[var(--ink-soft)]">assured</div>
          </div>
          <div className="card p-3">
            <Leaf className="w-5 h-5 text-[var(--green-700)] mx-auto" />
            <div className="text-[11px] font-bold mt-1">Farm</div>
            <div className="text-[10px] text-[var(--ink-soft)]">fresh</div>
          </div>
        </div>

        {!user && (
          <div className="text-center mt-6 text-sm">
            <span className="text-[var(--ink-soft)]">Want faster checkout? </span>
            <Link to="/login" className="font-bold text-[var(--green-700)]">
              Login / Sign up
            </Link>
            <span className="text-[var(--ink-soft)]"> (optional)</span>
          </div>
        )}
        <p className="text-center text-[11px] text-[var(--ink-soft)] mt-3 flex items-center justify-center gap-1">
          <Store className="w-3 h-3" /> Browse from anywhere
          {radius > 0 && ` — we deliver within ${radius} km of ${store?.city ?? 'Avinashi'}`}.
        </p>
        <div className="text-center mt-4">
          <Link to="/home" className="text-xs font-bold text-[var(--ink-soft)]">
            Skip for now →
          </Link>
        </div>
      </div>
    </div>
  );
}
