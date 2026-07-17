import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  HeartHandshake,
  Leaf,
  MapPin,
  Navigation,
  Search,
  ShieldCheck,
  Snowflake,
} from 'lucide-react';
import { AREAS, BRAND } from '@/api/_seed';
import type { Area } from '@/api/_seed';
import { LeafDefsLogin, LiveLeavesLogin } from '@/shared/LiveLeaf';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import { useToast } from '@/hooks/useToast';
import { distanceFromStore, geoErrorMessage, nearestArea } from '@/utils/geo';
import { formatPhone, isValidPhone } from '@/utils/normalizePhone';
import type { UserLocation } from '@/types';

const OTP_LENGTH = 6;
const DEMO_OTP = '123456';

/* Ports login.html: step 1 sets the delivery location, step 2 unlocks the
   phone/OTP form. A location is always enough to unlock login — the delivery-
   radius restriction is enforced at checkout, not here. */
export function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/home';
  const push = useToast();
  const setLocation = useLocationStore((s) => s.setLocation);
  const login = useAuthStore((s) => s.login);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Area[] | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [pending, setPending] = useState<UserLocation | null>(null);

  const [phone, setPhone] = useState('');
  const [phErr, setPhErr] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [otpErr, setOtpErr] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const seg2Ref = useRef<HTMLDivElement>(null);

  // Location is set — bring the (now unlocked) login step into view.
  useEffect(() => {
    if (pending) seg2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [pending]);

  const areaList = AREAS.map((a) => ({ ...a, dist: distanceFromStore(a.lat, a.lng) }))
    .filter((a) => a.area.toLowerCase().includes(query.toLowerCase()) || a.pincode.includes(query))
    .sort((x, y) => x.dist - y.dist);

  const capture = (loc: UserLocation) => {
    setPending(loc);
    setLocation(loc);
  };

  const pick = (a: Area) => {
    setSuggestions(null);
    const dist = distanceFromStore(a.lat, a.lng);
    capture({
      area: a.area,
      latitude: +a.lat.toFixed(5),
      longitude: +a.lng.toFixed(5),
      pincode: a.pincode,
      serviceable: dist <= BRAND.radiusKm,
      distance_from_store_km: +dist.toFixed(1),
    });
  };

  const onSearch = (value: string) => {
    setQuery(value);
    const q = value.trim();
    if (!q) {
      setSuggestions(null);
      return;
    }
    setSuggestions(
      AREAS.filter((a) => a.area.toLowerCase().includes(q.toLowerCase()) || a.pincode.includes(q)),
    );
  };

  /* current location — real GPS only; no fake fallback. */
  const detectGPS = () => {
    setDetecting(true);
    let settled = false;
    const fail = (msg: string) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(wd);
      setDetecting(false);
      push(msg, 'err', 'map-pin');
    };
    const done = (lat: number, lng: number, accuracy: number) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(wd);
      setDetecting(false);
      const dist = distanceFromStore(lat, lng);
      // Only borrow a known area's label/pincode when we're genuinely close to it.
      const near = nearestArea(lat, lng);
      const name = near && near.d <= 5 ? `My current location • near ${near.area}` : 'My current location';
      capture({
        area: name,
        latitude: +lat.toFixed(5),
        longitude: +lng.toFixed(5),
        pincode: near && near.d <= 5 ? near.pincode : '',
        serviceable: dist <= BRAND.radiusKm,
        distance_from_store_km: +dist.toFixed(1),
        accuracy_m: accuracy ? Math.round(accuracy) : null,
        source: 'gps',
      });
    };
    const wd = window.setTimeout(() => fail('Could not get your location — check GPS and try again'), 20000);

    if (!navigator.geolocation || !window.isSecureContext) {
      fail('Location needs a secure page — open this site over http://localhost or https, not as a file');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => done(p.coords.latitude, p.coords.longitude, p.coords.accuracy),
      (e) => fail(geoErrorMessage(e.code)),
      { enableHighAccuracy: true, timeout: 18000, maximumAge: 0 },
    );
  };

  /* Login only needs *a* location — serviceability is checked at checkout. */
  const ensureLoc = () => {
    if (!pending) {
      push('Please set your location first', 'err', 'map-pin');
      return false;
    }
    return true;
  };

  const sendOtp = () => {
    if (!ensureLoc()) return;
    if (!isValidPhone(phone)) {
      setPhErr('Enter a valid 10-digit number');
      return;
    }
    setPhErr('');
    setOtpSent(true);
    setTimeout(() => otpRefs.current[0]?.focus(), 0);
    push('OTP sent (demo: 123456)', 'ok', 'message-square');
  };

  const setOtpAt = (i: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setOtp((prev) => prev.map((d, idx) => (idx === i ? digit : d)));
    if (digit && i < OTP_LENGTH - 1) otpRefs.current[i + 1]?.focus();
  };

  const onOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const verifyOtp = () => {
    if (otp.join('') !== DEMO_OTP) {
      setOtpErr('Invalid OTP. Use 123456 for demo.');
      return;
    }
    login({ loggedIn: true, name: 'SRIAADHYA Customer', phone: formatPhone(phone) });
    push('Logged in 🌱', 'ok', 'check');
    setTimeout(() => navigate(next, { replace: true }), 700);
  };

  const acc = pending?.accuracy_m;
  const ok = pending?.serviceable ?? false;

  return (
    <div className="login-page">
      {/* ===================== LEFT · BRAND ===================== */}
      <section className="brand-side lg:w-1/2 flex flex-col justify-center items-center text-center px-7 py-6 lg:px-14 lg:py-12 relative">
        <LeafDefsLogin />
        <LiveLeavesLogin />

        {/* faint ambient accents */}
        <Leaf className="leaf l3 leaf-float" style={{ animationDelay: '1.4s' }} />
        <Leaf className="leaf l4 leaf-float" style={{ animationDelay: '2s' }} />

        {/* brand wordmark */}
        <div className="logo-plate" style={{ animation: 'bounceIn .9s ease' }}>
          <span className="orbit" />
          <img
            src="/images/logo-full.png"
            alt="SRI AADHYA — Bloom Like a Blossom"
            className="logo-banner sm lg:!w-[360px]"
          />
        </div>

        {/* tagline */}
        <div className="tagline mt-6 lg:mt-7" style={{ animation: 'fadeUp .7s .25s both' }}>
          <Snowflake className="w-3.5 h-3.5" /> Freshness Frozen, Goodness Preserved
        </div>

        {/* feature badges (desktop — keeps the locked mobile screen compact) */}
        <div className="feats mt-8 hidden lg:flex" style={{ animation: 'fadeUp .7s .4s both' }}>
          <div className="feat">
            <span className="feat-ico">
              <Leaf />
            </span>
            <span className="feat-lbl">
              100%
              <br />
              Natural
            </span>
          </div>
          <div className="feat">
            <span className="feat-ico">
              <Snowflake />
            </span>
            <span className="feat-lbl">
              Frozen
              <br />
              Fresh
            </span>
          </div>
          <div className="feat">
            <span className="feat-ico">
              <ShieldCheck />
            </span>
            <span className="feat-lbl">
              Premium
              <br />
              Quality
            </span>
          </div>
          <div className="feat">
            <span className="feat-ico">
              <HeartHandshake />
            </span>
            <span className="feat-lbl">
              Made for
              <br />
              Families
            </span>
          </div>
        </div>

        <p className="text-[12px] text-[var(--ink-soft)] mt-5 hidden lg:block" style={{ animation: 'fadeIn 1s .7s both' }}>
          100% Natural • Hygienically Packed • Avinashi, Tirupur
        </p>
      </section>

      {/* ===================== RIGHT · FORM ===================== */}
      <section className="form-side lg:w-1/2 px-4 py-4 lg:px-10 lg:py-10">
        <div className="form-wrap">
          <div className="auth-card p-5 lg:p-6 rise d1">
            <div className="mb-4 flex-none flex items-center gap-3">
              <span className="welcome-chip">
                <Leaf className="w-5 h-5" />
              </span>
              <div>
                <h2 className="display text-2xl lg:text-3xl font-extrabold leading-tight">Welcome 👋</h2>
                <p className="text-[12.5px] lg:text-[15px] text-[var(--ink-soft)] mt-0.5">
                  Set your location, then log in to start ordering.
                </p>
              </div>
            </div>

            {/* STEP 1 · LOCATION (above phone) */}
            <div id="seg1" className={`seg ${pending ? 'done' : 'on'}`}>
              <div className="step-head">
                <span className="seg-num">1</span>
                <span className="step-title">Delivery location</span>
                <span className="step-count">Step 1 / 2</span>
              </div>

              <button
                id="gpsBtn"
                onClick={detectGPS}
                disabled={detecting}
                className="btn btn-primary btn-xl w-full shine-wrap"
              >
                <Navigation className={`w-5 h-5 ${detecting ? 'animate-spin' : ''}`} />
                <span>{detecting ? 'Detecting…' : 'Use my current location'}</span>
              </button>

              <div className="relative mt-3">
                <div className="flex items-center bg-white border border-[var(--line)] rounded-[14px] px-3 h-12 focus-within:border-[var(--green-600)] focus-within:shadow-[0_0_0_3px_var(--leaf-100)] transition">
                  <Search className="w-4 h-4 text-[var(--ink-soft)]" />
                  <input
                    id="areaSearch"
                    value={query}
                    onChange={(e) => onSearch(e.target.value)}
                    autoComplete="off"
                    placeholder="Search your area or pincode…"
                    className="flex-1 bg-transparent outline-none text-sm px-2"
                  />
                </div>
                {suggestions && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-[var(--line)] rounded-xl shadow-lg z-20 overflow-hidden">
                    {suggestions.length === 0 ? (
                      <div className="p-3 text-sm text-[var(--ink-soft)]">
                        Address not found. Try “Use my current location”.
                      </div>
                    ) : (
                      suggestions.map((a) => (
                        <button
                          key={a.pincode + a.area}
                          onClick={() => pick(a)}
                          className="w-full text-left px-3 py-2.5 hover:bg-[var(--cream)] border-b border-[var(--line)] last:border-0 text-sm"
                        >
                          <b>{a.area}</b> <span className="text-[11px] text-[var(--ink-soft)]">{a.pincode}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="area-block mt-4">
                <div className="text-[11px] font-bold text-[var(--ink-soft)] uppercase tracking-wide mb-2 flex items-center gap-1 flex-none">
                  <MapPin className="w-3.5 h-3.5" /> Popular areas near you
                </div>
                <div id="areaList" className="space-y-2 overflow-y-auto hide-scroll pr-1">
                  {areaList.map((a) => {
                    const deliverable = a.dist <= BRAND.radiusKm;
                    const isSel = pending?.area === a.area;
                    return (
                      <button
                        key={a.pincode + a.area}
                        onClick={() => pick(a)}
                        className={`loc-pill w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--line)] bg-white text-left no-tap ${
                          isSel ? 'sel' : ''
                        } ${deliverable ? '' : 'opacity-60'}`}
                      >
                        <span
                          className={`w-9 h-9 rounded-lg ${
                            deliverable ? 'bg-[var(--leaf-100)]' : 'bg-gray-100'
                          } flex items-center justify-center flex-none`}
                        >
                          <MapPin className={`w-4 h-4 ${deliverable ? 'text-[var(--green-700)]' : 'text-gray-400'}`} />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block font-bold text-sm truncate">{a.area}</span>
                          <span className="block text-[11px] text-[var(--ink-soft)]">
                            {a.pincode} • {a.dist.toFixed(1)} km away
                          </span>
                        </span>
                        {deliverable ? (
                          <span className="text-[10px] font-bold text-[var(--green-700)] bg-[var(--leaf-100)] px-2 py-0.5 rounded-full">
                            Deliverable
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-[var(--coral)]">Too far</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {pending && (
                <div
                  className={`mt-4 p-3.5 rounded-xl rise ${
                    ok
                      ? 'bg-[var(--leaf-100)] border border-[var(--green-500)]/40'
                      : 'bg-amber-50 border border-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[var(--green-700)] flex-none pop-check" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{pending.area}</div>
                      <div className="text-[11px] font-semibold">
                        {ok ? (
                          <span className="text-[var(--green-700)]">
                            ✅ We deliver here • {pending.distance_from_store_km.toFixed(1)} km away
                          </span>
                        ) : (
                          <span className="text-amber-700">
                            {pending.distance_from_store_km.toFixed(1)} km away — outside our {BRAND.radiusKm} km
                            delivery zone. You can still browse.
                          </span>
                        )}
                        {/* Warn when the fix is too coarse to trust (Wi-Fi/IP lookup rather than real GPS). */}
                        {acc && acc > 1000 && (
                          <span className="block mt-1 text-[11px] text-[var(--ink-soft)]">
                            Approximate fix (±{(acc / 1000).toFixed(1)} km) — not GPS. If this looks wrong, pick your
                            area from the list.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="login-div my-4 flex-none">
              <span className="ln" />
              <span className="lb">then login</span>
              <span className="ln" />
            </div>

            {/* STEP 2 · LOGIN (phone — below location) */}
            <div ref={seg2Ref} id="seg2" className={`seg flex-none ${pending ? 'on' : ''}`}>
              <div className="step-head">
                <span className="seg-num">2</span>
                <span className="step-title">Login with mobile</span>
                <span className="step-count">Step 2 / 2</span>
              </div>

              {(!pending || !ok) && (
                <div className="flex items-center gap-2 bg-[#FFF6DC] text-[#7a5b00] text-xs font-semibold px-3 py-2.5 rounded-xl mb-3">
                  {!pending ? (
                    <>
                      <ArrowUp className="w-3.5 h-3.5" /> Select a deliverable location above to continue.
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" /> Outside our {BRAND.radiusKm} km delivery zone — you can
                      log in and browse, but ordering isn't available here yet.
                    </>
                  )}
                </div>
              )}
              {pending && (
                <div className="flex items-center gap-2 bg-[var(--leaf-100)] text-[var(--green-800)] text-xs font-semibold px-3 py-2.5 rounded-xl mb-3">
                  <MapPin className="w-3.5 h-3.5" /> {ok ? 'Delivering to' : 'Viewing from'} <b>{pending.area}</b>
                </div>
              )}

              <div className={`lock-veil ${pending ? '' : 'locked'}`}>
                {!otpSent ? (
                  <div>
                    <label className="text-sm font-bold">Mobile number</label>
                    <div className="flex items-center field field-lg mt-1.5 gap-2">
                      <span className="font-extrabold text-[var(--ink-soft)]">+91</span>
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        maxLength={10}
                        inputMode="numeric"
                        placeholder="10-digit number"
                        className="flex-1 outline-none bg-transparent"
                      />
                    </div>
                    <div className="text-xs text-[var(--coral)] mt-1">{phErr}</div>
                    <button onClick={sendOtp} className="btn btn-primary btn-xl w-full mt-4 shine-wrap">
                      Send OTP <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-[var(--ink-soft)]">
                      Enter the OTP sent to <b>{formatPhone(phone)}</b>{' '}
                      <button onClick={() => setOtpSent(false)} className="text-[var(--green-700)] font-bold">
                        Edit
                      </button>
                    </p>
                    <div className="flex gap-2 justify-center my-4" id="otpInputs">
                      {otp.map((d, i) => (
                        <input
                          key={i}
                          ref={(el) => {
                            otpRefs.current[i] = el;
                          }}
                          value={d}
                          onChange={(e) => setOtpAt(i, e.target.value)}
                          onKeyDown={(e) => onOtpKeyDown(i, e)}
                          maxLength={1}
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="w-10 h-12 sm:w-11 sm:h-12 text-center text-xl font-extrabold field"
                        />
                      ))}
                    </div>
                    <div className="text-center text-[12px] text-[var(--ink-soft)] mb-2">
                      Demo OTP: <b className="text-[var(--green-700)]">123456</b>
                    </div>
                    <div className="text-xs text-[var(--coral)] text-center mb-2">{otpErr}</div>
                    <button onClick={verifyOtp} className="btn btn-primary btn-xl w-full">
                      Verify &amp; Continue
                    </button>
                    <button
                      onClick={() => setOtp(DEMO_OTP.split(''))}
                      className="btn btn-ghost w-full mt-2 py-2.5 text-sm"
                    >
                      Auto-fill demo OTP
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className="text-center text-[11px] text-[var(--ink-soft)] mt-4">
            By continuing you agree to our Terms &amp; Privacy Policy.
          </p>
        </div>
      </section>
    </div>
  );
}
