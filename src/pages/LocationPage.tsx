import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Info, Leaf, MapPin, Navigation, Search, ShieldCheck, Store, Timer, Zap } from 'lucide-react';
import { AREAS, BRAND } from '@/api/_seed';
import type { Area } from '@/api/_seed';
import { useLocationStore } from '@/store/locationStore';
import { distanceFromStore, geoErrorMessage } from '@/utils/geo';
import type { UserLocation } from '@/types';

/* Ports location.html. Real GPS only — no fake fallback, so the pin is always
   the user's actual position. Every location is accepted here; the delivery-
   radius check happens at checkout. */
export function LocationPage() {
  const navigate = useNavigate();
  const setLocation = useLocationStore((s) => s.setLocation);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Area[] | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [hint, setHint] = useState<{ text: string; error: boolean }>({
    text: 'We use this only to check delivery & navigate to you',
    error: false,
  });
  const [pending, setPending] = useState<UserLocation | null>(null);

  const onSearch = (value: string) => {
    setQuery(value);
    const q = value.trim().toLowerCase();
    if (!q) {
      setSuggestions(null);
      return;
    }
    setSuggestions(AREAS.filter((a) => a.area.toLowerCase().includes(q)).slice(0, 6));
  };

  const showCaptured = (area: string, lat: number, lng: number, pincode: string, accuracy?: number) => {
    const dist = distanceFromStore(lat, lng);
    setPending({
      area,
      latitude: +lat.toFixed(5),
      longitude: +lng.toFixed(5),
      pincode,
      serviceable: dist <= BRAND.radiusKm,
      distance_from_store_km: +dist.toFixed(1),
      accuracy_m: accuracy ? Math.round(accuracy) : null,
    });
  };

  const pickArea = (a: Area) => {
    setSuggestions(null);
    setQuery(a.area);
    showCaptured(a.area, a.lat, a.lng, a.pincode);
  };

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
    const done = (lat: number, lng: number, accuracy: number) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(wd);
      setDetecting(false);
      setHint({ text: 'We use this only to check delivery & navigate to you', error: false });
      showCaptured('My current location', lat, lng, '', accuracy);
    };
    const wd = window.setTimeout(() => fail('Could not get your location — check GPS and try again'), 20000);

    if (!navigator.geolocation || !window.isSecureContext) {
      fail('Location needs a secure page — open over http://localhost or https, not as a file');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => done(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
      (e) => fail(geoErrorMessage(e.code)),
      { enableHighAccuracy: true, timeout: 18000, maximumAge: 0 },
    );
  };

  /* Any location continues to the store — no gate here. */
  const confirmLocation = () => {
    if (!pending) return;
    setLocation(pending);
    navigate('/home');
  };

  const acc = pending?.accuracy_m;

  return (
    <div className="min-h-screen flex flex-col">
      {/* top decorative band */}
      <div className="brand-grad-soft text-white px-6 pt-12 pb-20 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 text-[120px] opacity-10 leaf-sway">🌿</div>
        <div className="absolute right-20 bottom-2 text-5xl opacity-20 float">🍃</div>
        <div className="max-w-md mx-auto relative">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg">
              <img src="/images/logo.png" alt="SRI AADHYA FROZENS" className="w-10 h-10 object-contain" />
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
            <Zap className="w-4 h-4" /> 30-min delivery in Avinashi & 10 km around
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-5 -mt-12 relative flex-1 pb-10">
        <div className="card p-5 shadow-lg" style={{ animation: 'fadeUp .5s ease' }}>
          {/* GPS */}
          <button onClick={detectGPS} disabled={detecting} className="btn btn-primary w-full py-3.5 text-base">
            <Navigation className={`w-5 h-5 ${detecting ? 'animate-spin' : ''}`} />
            <span>{detecting ? 'Detecting…' : 'Use my current location'}</span>
          </button>
          <p className="text-[11px] text-center mt-2 text-[var(--ink-soft)]">
            {hint.error ? <span className="text-[var(--coral)]">{hint.text}</span> : hint.text}
          </p>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[var(--line)]" />
            <span className="text-xs text-[var(--ink-soft)] font-semibold">OR</span>
            <div className="flex-1 h-px bg-[var(--line)]" />
          </div>

          {/* Search */}
          <div className="relative">
            <div className="flex items-center bg-[var(--cream)] border border-[var(--line)] rounded-xl px-3 h-12">
              <Search className="w-5 h-5 text-[var(--ink-soft)]" />
              <input
                value={query}
                onChange={(e) => onSearch(e.target.value)}
                autoComplete="off"
                placeholder="Search your area…"
                className="flex-1 bg-transparent outline-none px-2 text-sm"
              />
            </div>
            {suggestions && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-[var(--line)] rounded-xl shadow-lg z-10 overflow-hidden">
                {suggestions.length === 0 ? (
                  <div className="p-3 text-sm text-[var(--ink-soft)]">
                    Address not found. Please use “Use my current location” instead.
                  </div>
                ) : (
                  suggestions.map((a) => (
                    <button
                      key={a.pincode + a.area}
                      onClick={() => pickArea(a)}
                      className="w-full text-left px-3 py-2.5 hover:bg-[var(--cream)] flex items-center gap-2 border-b border-[var(--line)] last:border-0"
                    >
                      <MapPin className="w-4 h-4 text-[var(--green-700)]" />
                      <span className="text-sm">
                        <b>{a.area}</b>
                        <span className="block text-[11px] text-[var(--ink-soft)]">{a.pincode}</span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* captured preview */}
          {pending && (
            <div className="mt-4 p-3 rounded-xl bg-[var(--leaf-100)] border border-[var(--green-500)]/30">
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-[var(--green-700)] mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold text-sm">{pending.area}</div>
                  <div className="text-[11px] text-[var(--ink-soft)] font-mono">
                    {pending.latitude.toFixed(5)}, {pending.longitude.toFixed(5)}
                    {acc ? ` • ±${acc} m` : ''}
                  </div>
                  <div className="text-[11px] font-semibold mt-1">
                    {/* Every location is allowed through — this only sets the tone of the message. */}
                    {pending.serviceable ? (
                      <span className="text-[var(--green-700)] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> We deliver here •{' '}
                        {pending.distance_from_store_km.toFixed(1)} km away
                      </span>
                    ) : (
                      <span className="text-amber-700 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" /> {pending.distance_from_store_km.toFixed(1)} km away — outside
                        our {BRAND.radiusKm} km zone. You can browse; ordering isn't available here yet.
                      </span>
                    )}
                    {acc && acc > 1000 && (
                      <span className="block mt-1 text-[11px] text-[var(--ink-soft)]">
                        Approximate fix (±{(acc / 1000).toFixed(1)} km) — not GPS. If this looks wrong, search your area
                        below.
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={confirmLocation} className="btn btn-primary w-full mt-3 py-3">
                Confirm & Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* trust strip */}
        <div className="grid grid-cols-3 gap-2 mt-5 text-center">
          <div className="card p-3">
            <Timer className="w-5 h-5 text-[var(--green-700)] mx-auto" />
            <div className="text-[11px] font-bold mt-1">30 min</div>
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

        {/* optional login */}
        <div className="text-center mt-6 text-sm">
          <span className="text-[var(--ink-soft)]">Want faster checkout? </span>
          <Link to="/login" className="font-bold text-[var(--green-700)]">
            Login / Sign up
          </Link>
          <span className="text-[var(--ink-soft)]"> (optional)</span>
        </div>
        <p className="text-center text-[11px] text-[var(--ink-soft)] mt-3 flex items-center justify-center gap-1">
          <Store className="w-3 h-3" /> Browse from anywhere — we deliver within 10 km of Avinashi.
        </p>
      </div>
    </div>
  );
}
