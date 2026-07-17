import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Briefcase, Home, Info, MapPin, Navigation, Plus, Trash2 } from 'lucide-react';
import {
  useCoordinateToAddress,
  useDeleteAddress,
  useGetAddresses,
  useSaveAddress,
} from '@/api/mutations/useAddresses';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { canDeliverTo, isWithinRadius } from '@/utils/deliveryRules';
import { distanceKm, geoErrorMessage } from '@/utils/geo';
import { isValidPhone } from '@/utils/normalizePhone';
import { DotLoader } from '@/ui/DotLoader';

const LABELS = [
  { label: 'Home', Icon: Home },
  { label: 'Work', Icon: Briefcase },
  { label: 'Other', Icon: MapPin },
];

interface Pin {
  lat: number;
  lng: number;
  dist: number;
  serviceable: boolean;
}

const EMPTY = {
  receiverName: '',
  phone: '',
  houseNo: '',
  street: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
};

/** Saved addresses, and the checkout's address step.

    `?mode=checkout` is what tells the two apart: from the cart it shows the
    Continue CTA, from the profile it's a plain address book. Selecting a card
    never navigates — that's the Continue button's job. */
export function AddressPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isCheckoutFlow = params.get('mode') === 'checkout';
  const push = useToast();

  const user = useAuthStore((s) => s.user);
  const store = useAppStore((s) => s.storeLocation);
  const activeAddressId = useAppStore((s) => s.activeAddressId);
  const setActiveAddress = useAppStore((s) => s.setActiveAddress);

  const { data: addresses, isLoading } = useGetAddresses();
  const saveAddress = useSaveAddress();
  const deleteAddress = useDeleteAddress();
  const reverseGeocode = useCoordinateToAddress();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [label, setLabel] = useState('Home');
  const [pin, setPin] = useState<Pin | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [formErr, setFormErr] = useState('');

  useEffect(() => {
    if (!user) navigate(`/login?next=${encodeURIComponent(isCheckoutFlow ? '/address?mode=checkout' : '/address')}`, { replace: true });
  }, [user, navigate, isCheckoutFlow]);

  /* Land on the customer's usual address rather than making them pick again —
     but never auto-select one the store can't deliver to, which would arm the
     Continue button for an order that must be refused. */
  useEffect(() => {
    if (!addresses?.length || activeAddressId) return;
    const deliverable = addresses.filter(canDeliverTo);
    const preferred =
      deliverable.find((a) => a.id === String(user?.defaultAddressId ?? '')) ??
      deliverable.find((a) => a.isDefault) ??
      deliverable[0];
    if (preferred) setActiveAddress(preferred.id);
  }, [addresses, activeAddressId, user, setActiveAddress]);

  const set = (k: keyof typeof EMPTY, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const radius = store?.deliveryRadius ?? 0;

  const canSave =
    !!pin &&
    pin.serviceable &&
    !!form.receiverName.trim() &&
    isValidPhone(form.phone) &&
    !!form.houseNo.trim() &&
    !!form.street.trim() &&
    !!form.city.trim() &&
    /^\d{6}$/.test(form.pincode.trim());

  const detectGPS = () => {
    setDetecting(true);

    const done = async (lat: number, lng: number) => {
      const dist = store ? distanceKm(lat, lng, store.latitude, store.longitude) : 0;
      const serviceable = !store || isWithinRadius(dist, radius);
      setPin({ lat: +lat.toFixed(5), lng: +lng.toFixed(5), dist: +dist.toFixed(1), serviceable });

      /* Prefill from the same geocoder the admin panel reads, so the address on
         the order matches what the store's dashboard shows. */
      try {
        const text = await reverseGeocode.mutateAsync({ lat, lng });
        if (text) {
          setForm((f) => ({
            ...f,
            street: f.street || text,
            city: f.city || (store?.city ?? ''),
            state: f.state || (store?.state ?? ''),
          }));
        }
      } catch {
        /* the pin is what delivers the order — a missing label is not fatal */
      }
      setDetecting(false);
      if (serviceable) push('📍 Location captured', 'ok', 'map-pin');
    };

    if (!navigator.geolocation || !window.isSecureContext) {
      setDetecting(false);
      push('Location needs a secure page — open over https', 'err', 'map-pin');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => void done(p.coords.latitude, p.coords.longitude),
      (e) => {
        setDetecting(false);
        push(geoErrorMessage(e.code), 'err', 'map-pin');
      },
      { enableHighAccuracy: true, timeout: 18000, maximumAge: 0 },
    );
  };

  const submit = async () => {
    setFormErr('');
    if (!pin) {
      setFormErr('Tap "Use current location" so we can pin your address.');
      return;
    }
    if (!pin.serviceable) {
      setFormErr('This address is outside our delivery area.');
      return;
    }
    if (!canSave) {
      setFormErr('Please fill every required field (10-digit phone, 6-digit pincode).');
      return;
    }

    try {
      const saved = await saveAddress.mutateAsync({
        label,
        receiverName: form.receiverName.trim(),
        phone: form.phone.trim(),
        houseNo: form.houseNo.trim(),
        street: form.street.trim(),
        landmark: form.landmark.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        latitude: pin.lat,
        longitude: pin.lng,
      });
      if (saved) setActiveAddress(saved.id);
      setShowForm(false);
      setForm(EMPTY);
      setPin(null);
      push('Address saved 🌱', 'ok', 'check');
    } catch {
      setFormErr('Could not save that address. Please try again.');
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteAddress.mutateAsync(id);
      if (activeAddressId === id) setActiveAddress(null);
      push('Address removed', '', 'trash-2');
    } catch {
      push('Could not remove that address', 'err', 'x');
    }
  };

  if (isLoading) return <DotLoader />;

  const list = addresses ?? [];

  return (
    <main className="pt-16 pb-28 lg:pb-10">
      <div className="max-w-3xl mx-auto px-4 lg:px-8 mt-4">
        <Link
          to={isCheckoutFlow ? '/cart' : '/profile'}
          className="text-sm font-bold text-[var(--green-700)] flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> {isCheckoutFlow ? 'Back to cart' : 'Back to profile'}
        </Link>
        <h1 className="display text-2xl font-extrabold mb-4 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-[var(--green-700)]" /> {isCheckoutFlow ? 'Delivery Address' : 'Saved Addresses'}
        </h1>

        {/* saved list */}
        <div className="space-y-3 mb-5">
          {list.length === 0 ? (
            <div className="card p-4 text-sm text-[var(--ink-soft)] text-center">
              No saved addresses yet. Add one to continue.
            </div>
          ) : (
            list.map((a) => {
              const deliverable = canDeliverTo(a);
              return (
                <div
                  key={a.id}
                  onClick={() => deliverable && setActiveAddress(a.id)}
                  role="button"
                  className={`card p-4 flex gap-3 ${a.id === activeAddressId ? 'ring-2 ring-[var(--green-600)]' : ''} ${
                    deliverable ? '' : 'opacity-70'
                  }`}
                >
                  <input
                    type="radio"
                    name="addr"
                    className="accent-[var(--green-700)] mt-1"
                    checked={a.id === activeAddressId}
                    disabled={!deliverable}
                    onChange={() => setActiveAddress(a.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-extrabold uppercase bg-[var(--leaf-100)] text-[var(--green-800)] px-2 py-0.5 rounded">
                        {a.label}
                      </span>
                      <span className="font-bold text-sm truncate">{a.receiverName}</span>
                      {!deliverable && (
                        <span className="text-[10px] font-bold text-[var(--coral)] bg-red-50 px-2 py-0.5 rounded-full">
                          Outside delivery area
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-[var(--ink-soft)] mt-1">
                      {[a.houseNo, a.street, a.city, a.pincode].filter(Boolean).join(', ')}
                    </div>
                    {a.phone && <div className="text-[11px] text-[var(--ink-soft)] mt-0.5">{a.phone}</div>}
                    <div className="flex gap-3 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void onDelete(a.id);
                        }}
                        className="text-[11px] text-[var(--coral)] font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
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

            <button onClick={detectGPS} disabled={detecting} className="btn btn-primary py-3 w-full mb-4">
              <Navigation className={`w-5 h-5 ${detecting ? 'animate-spin' : ''}`} />
              <span>{detecting ? 'Detecting…' : 'Use Current Location'}</span>
            </button>

            {pin && (
              <div
                className={`mb-4 p-3 rounded-xl text-sm ${
                  pin.serviceable ? 'bg-[var(--leaf-100)] text-[var(--green-800)]' : 'bg-red-50 text-[var(--coral)]'
                }`}
              >
                {pin.serviceable ? (
                  <>
                    <b>📍 Location captured</b> • {pin.dist.toFixed(1)} km from store — we deliver here ✅
                  </>
                ) : (
                  <>
                    This address is {pin.dist.toFixed(1)} km away — outside our {radius} km delivery area. Please choose
                    a different one.
                  </>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-bold">Address label</label>
                <div className="flex gap-2 mt-1">
                  {LABELS.map(({ label: l, Icon }) => (
                    <button key={l} type="button" onClick={() => setLabel(l)} className={`chip ${label === l ? 'active' : ''}`}>
                      <Icon className="w-3.5 h-3.5" /> {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold">Receiver name*</label>
                <input value={form.receiverName} onChange={(e) => set('receiverName', e.target.value)} className="field mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold">Phone (10-digit)*</label>
                <input
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  inputMode="numeric"
                  className="field mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-bold">House / Flat No.*</label>
                <input value={form.houseNo} onChange={(e) => set('houseNo', e.target.value)} className="field mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold">Landmark</label>
                <input value={form.landmark} onChange={(e) => set('landmark', e.target.value)} className="field mt-1" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold">Street / Area*</label>
                <input value={form.street} onChange={(e) => set('street', e.target.value)} className="field mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold">City*</label>
                <input value={form.city} onChange={(e) => set('city', e.target.value)} className="field mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold">State*</label>
                <input value={form.state} onChange={(e) => set('state', e.target.value)} className="field mt-1" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold">Pincode (6-digit)*</label>
                <input
                  value={form.pincode}
                  onChange={(e) => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  inputMode="numeric"
                  className="field mt-1"
                />
              </div>
            </div>

            {formErr && <div className="text-xs text-[var(--coral)] mt-3">{formErr}</div>}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowForm(false);
                  setFormErr('');
                }}
                className="btn btn-ghost flex-1 py-3"
              >
                Cancel
              </button>
              <button
                onClick={() => void submit()}
                disabled={!canSave || saveAddress.isPending}
                className={`btn btn-primary flex-1 py-3 ${!canSave || saveAddress.isPending ? 'opacity-50' : ''}`}
              >
                {saveAddress.isPending ? 'Saving…' : 'Save Address'}
              </button>
            </div>
            <p className="text-[11px] text-[var(--ink-soft)] mt-2 flex items-center gap-1">
              <Info className="w-3 h-3" /> GPS coordinates are required for delivery routing.
            </p>
          </div>
        )}

        {/* The CTA arms only on an address the store will actually deliver to —
            an out-of-zone one can be kept and viewed, just not ordered against. */}
        {isCheckoutFlow && !showForm && list.length > 0 && canDeliverTo(list.find((a) => a.id === activeAddressId)) && (
          <button onClick={() => navigate('/payment')} className="btn btn-primary w-full mt-6 py-3.5 text-base">
            Continue to Payment <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {isCheckoutFlow && !showForm && list.length > 0 && !canDeliverTo(list.find((a) => a.id === activeAddressId)) && (
          <p className="text-center text-sm text-[var(--ink-soft)] mt-6">
            {activeAddressId
              ? "That address is outside our delivery area — pick another one, or add an address we can reach."
              : 'Select a delivery address to continue.'}
          </p>
        )}
      </div>
    </main>
  );
}
