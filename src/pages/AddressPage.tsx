import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Briefcase, Home, Info, MapPin, Navigation, Plus, Search, Trash2 } from 'lucide-react';
import { AREAS, BRAND } from '@/api/_seed';
import type { Area } from '@/api/_seed';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { distanceFromStore } from '@/utils/geo';
import { isValidPhone } from '@/utils/normalizePhone';
import { makeAddressId } from '@/utils/orderId';
import type { Address } from '@/types';

const LABELS = [
  { label: 'Home', Icon: Home },
  { label: 'Work', Icon: Briefcase },
  { label: 'Other', Icon: MapPin },
];

interface Captured {
  lat: number;
  lng: number;
  dist: number;
  serviceable: boolean;
}

const EMPTY_FORM = {
  rname: '',
  rphone: '',
  house: '',
  building: '',
  street: '',
  landmark: '',
  city: 'Tirupur',
  pincode: '',
};

/* Ports address.html. Hard-gated: address.html runs serviceableGate(), which
   bounces a logged-out / out-of-zone visitor before the form renders. */
export function AddressPage() {
  const navigate = useNavigate();
  const push = useToast();
  const user = useAuthStore((s) => s.user);
  const addresses = useAppStore((s) => s.addresses);
  const activeAddressId = useAppStore((s) => s.activeAddressId);
  const addAddress = useAppStore((s) => s.addAddress);
  const deleteAddress = useAppStore((s) => s.deleteAddress);
  const setActiveAddress = useAppStore((s) => s.setActiveAddress);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedLabel, setSelectedLabel] = useState('Home');
  const [captured, setCaptured] = useState<Captured | null>(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Area[] | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [formErr, setFormErr] = useState('');

  useEffect(() => {
    if (!user?.loggedIn) navigate('/login?next=/address', { replace: true });
  }, [user, navigate]);

  const set = (k: keyof typeof EMPTY_FORM, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const valid =
    !!captured &&
    captured.serviceable &&
    !!form.rname.trim() &&
    isValidPhone(form.rphone) &&
    !!form.house.trim() &&
    !!form.street.trim() &&
    /^\d{6}$/.test(form.pincode.trim());

  const fill = (lat: number, lng: number, name: string, pin: string) => {
    const dist = distanceFromStore(lat, lng);
    const serviceable = dist <= BRAND.radiusKm;
    setCaptured({ lat: +lat.toFixed(5), lng: +lng.toFixed(5), dist: +dist.toFixed(1), serviceable });
    setForm((f) => ({ ...f, street: f.street || name, pincode: f.pincode || pin }));
    if (serviceable) push('📍 Location captured', 'ok', 'map-pin');
  };

  const onSearch = (value: string) => {
    setQuery(value);
    const q = value.trim().toLowerCase();
    if (!q) {
      setSuggestions(null);
      return;
    }
    setSuggestions(AREAS.filter((a) => a.area.toLowerCase().includes(q)));
  };

  const pick = (a: Area) => {
    setSuggestions(null);
    setQuery(a.area);
    fill(a.lat, a.lng, a.area, a.pincode);
  };

  const detectGPS = () => {
    setDetecting(true);
    const done = (lat: number, lng: number, name: string, pin: string) => {
      setDetecting(false);
      fill(lat, lng, name, pin);
    };
    if (!navigator.geolocation) {
      setTimeout(() => done(BRAND.storeLat + 0.01, BRAND.storeLng + 0.008, 'Avinashi', '641654'), 800);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => done(p.coords.latitude, p.coords.longitude, '', ''),
      () => {
        push('GPS denied — search your area', 'err', 'x');
        done(BRAND.storeLat + 0.011, BRAND.storeLng + 0.007, 'Near Avinashi', '641654');
      },
      { timeout: 8000 },
    );
  };

  const saveAddr = () => {
    setFormErr('');
    if (!captured) {
      setFormErr('Please capture GPS coordinates (Detect Location or Search).');
      return;
    }
    if (!captured.serviceable) {
      setFormErr('This address is outside our delivery area.');
      return;
    }
    if (!valid) {
      setFormErr('Please fill all required fields correctly (10-digit phone, 6-digit pincode).');
      return;
    }
    const a: Address = {
      id: makeAddressId(addresses.length),
      label: selectedLabel,
      receiver_name: form.rname.trim(),
      phone: form.rphone.trim(),
      house_no: form.house.trim(),
      building: form.building.trim(),
      street: form.street.trim(),
      landmark: form.landmark.trim(),
      city: form.city.trim() || 'Tirupur',
      // Backend returns state and GST depends on it — never drop this field.
      state: 'Tamil Nadu',
      pincode: form.pincode.trim(),
      latitude: captured.lat,
      longitude: captured.lng,
      distance_km: captured.dist,
      is_serviceable: true,
      created_at: new Date().toISOString(),
    };
    addAddress(a);
    setShowForm(false);
    setCaptured(null);
    setForm(EMPTY_FORM);
    setQuery('');
    push('Address saved 🌱', 'ok', 'check');
  };

  const continueCheckout = () => {
    if (!activeAddressId) {
      push('Select a delivery address', 'err', 'x');
      return;
    }
    navigate('/payment');
  };

  return (
    <main className="pt-16 pb-28 lg:pb-10">
      <div className="max-w-3xl mx-auto px-4 lg:px-8 mt-4">
        <Link to="/cart" className="text-sm font-bold text-[var(--green-700)] flex items-center gap-1 mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to cart
        </Link>
        <h1 className="display text-2xl font-extrabold mb-4 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-[var(--green-700)]" /> Delivery Address
        </h1>

        {/* saved list */}
        <div className="space-y-3 mb-5">
          {addresses.length === 0 ? (
            <div className="card p-4 text-sm text-[var(--ink-soft)] text-center">
              No saved addresses yet. Add one to continue.
            </div>
          ) : (
            addresses.map((a) => (
              <div
                key={a.id}
                onClick={() => setActiveAddress(a.id)}
                role="button"
                className={`card p-4 flex gap-3 ${a.id === activeAddressId ? 'ring-2 ring-[var(--green-600)]' : ''}`}
              >
                <input
                  type="radio"
                  name="addr"
                  className="accent-[var(--green-700)] mt-1"
                  checked={a.id === activeAddressId}
                  onChange={() => setActiveAddress(a.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold uppercase bg-[var(--leaf-100)] text-[var(--green-800)] px-2 py-0.5 rounded">
                      {a.label}
                    </span>
                    <span className="font-bold text-sm">{a.receiver_name}</span>
                    <span className="text-[11px] text-[var(--ink-soft)]">{a.distance_km} km</span>
                  </div>
                  <div className="text-sm text-[var(--ink-soft)] mt-1">
                    {a.house_no}, {a.building ? a.building + ', ' : ''}
                    {a.street}, {a.city} - {a.pincode}
                  </div>
                  <div className="text-[11px] text-[var(--ink-soft)] font-mono mt-0.5">
                    📍 {a.latitude}, {a.longitude}
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAddress(a.id);
                        push('Address removed', '', 'trash-2');
                      }}
                      className="text-[11px] text-[var(--coral)] font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-ghost w-full py-3.5 border-2 border-dashed border-[var(--green-500)]/40"
          >
            <Plus className="w-5 h-5" /> Add New Address
          </button>
        )}

        {/* form */}
        {showForm && (
          <div className="card p-5 mt-5">
            <h3 className="font-extrabold mb-3">New Address</h3>

            {/* methods */}
            <div className="grid grid-cols-1 gap-2 mb-4">
              <button onClick={detectGPS} disabled={detecting} className="btn btn-primary py-3">
                <Navigation className={`w-5 h-5 ${detecting ? 'animate-spin' : ''}`} />{' '}
                <span>{detecting ? 'Detecting…' : 'Use Current Location'}</span>
              </button>
              <div className="relative">
                <div className="flex items-center bg-[var(--cream)] border border-[var(--line)] rounded-xl px-3 h-12">
                  <Search className="w-5 h-5 text-[var(--ink-soft)]" />
                  <input
                    value={query}
                    onChange={(e) => onSearch(e.target.value)}
                    autoComplete="off"
                    placeholder="Or search your area…"
                    className="flex-1 bg-transparent outline-none px-2 text-sm"
                  />
                </div>
                {suggestions && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-[var(--line)] rounded-xl shadow-lg z-10 overflow-hidden">
                    {suggestions.length === 0 ? (
                      <div className="p-3 text-sm text-[var(--ink-soft)]">
                        Address not found. Please use Detect Location instead.
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
            </div>

            {/* coordinate status */}
            {captured && (
              <div
                className={`mb-4 p-3 rounded-xl text-sm ${
                  captured.serviceable
                    ? 'bg-[var(--leaf-100)] text-[var(--green-800)]'
                    : 'bg-red-50 text-[var(--coral)]'
                }`}
              >
                {captured.serviceable ? (
                  <>
                    <b>📍 Location captured</b> • {captured.dist.toFixed(1)} km from store — we deliver here ✅
                  </>
                ) : (
                  <>
                    This address is {captured.dist.toFixed(1)} km away — outside our 10 km delivery area. Please choose a
                    different one.
                  </>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-bold">Address label</label>
                <div className="flex gap-2 mt-1">
                  {LABELS.map(({ label, Icon }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setSelectedLabel(label)}
                      className={`chip ${selectedLabel === label ? 'active' : ''}`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold">Receiver name*</label>
                <input value={form.rname} onChange={(e) => set('rname', e.target.value)} className="field mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold">Phone (10-digit)*</label>
                <input
                  value={form.rphone}
                  onChange={(e) => set('rphone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  inputMode="numeric"
                  className="field mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-bold">House / Flat No.*</label>
                <input value={form.house} onChange={(e) => set('house', e.target.value)} className="field mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold">Building / Apt</label>
                <input value={form.building} onChange={(e) => set('building', e.target.value)} className="field mt-1" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold">Street / Area*</label>
                <input value={form.street} onChange={(e) => set('street', e.target.value)} className="field mt-1" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold">Landmark (optional)</label>
                <input value={form.landmark} onChange={(e) => set('landmark', e.target.value)} className="field mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold">City*</label>
                <input value={form.city} onChange={(e) => set('city', e.target.value)} className="field mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold">Pincode (6-digit)*</label>
                <input
                  value={form.pincode}
                  onChange={(e) => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  inputMode="numeric"
                  className="field mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-bold">Latitude</label>
                <input value={captured?.lat ?? ''} className="field mt-1 bg-[var(--cream)]" readOnly placeholder="auto" />
              </div>
              <div>
                <label className="text-xs font-bold">Longitude</label>
                <input value={captured?.lng ?? ''} className="field mt-1 bg-[var(--cream)]" readOnly placeholder="auto" />
              </div>
            </div>

            {/* map preview thumbnail */}
            {captured && (
              <div className="mt-3 rounded-xl overflow-hidden border border-[var(--line)] relative h-28 bg-[var(--cream-2)]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-[var(--green-700)] pulse-ring" />
                </div>
                <div className="absolute bottom-1 left-2 text-[10px] font-mono bg-white/80 px-1.5 rounded">
                  {captured.lat}, {captured.lng}
                </div>
              </div>
            )}

            <div className="text-xs text-[var(--coral)] mt-3">{formErr}</div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowForm(false)} className="btn btn-ghost flex-1 py-3">
                Cancel
              </button>
              <button
                onClick={saveAddr}
                disabled={!valid}
                className={`btn btn-primary flex-1 py-3 ${valid ? '' : 'opacity-50'}`}
              >
                Save Address
              </button>
            </div>
            <p className="text-[11px] text-[var(--ink-soft)] mt-2 flex items-center gap-1">
              <Info className="w-3 h-3" /> GPS coordinates are required for delivery routing.
            </p>
          </div>
        )}

        {addresses.length > 0 && (
          <button onClick={continueCheckout} className="btn btn-primary w-full mt-6 py-3.5 text-base">
            Deliver here &amp; Continue <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </main>
  );
}
